import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getFaceModelTrainingCost, getSubscriptionLimits } from "../_shared/pricing.ts";

// S3 Client for cleanup operations
import { S3Client, DeleteObjectsCommand, ListObjectsV2Command } from "https://esm.sh/@aws-sdk/client-s3@3";

interface TrainingRequest {
  user_id: string;
  face_model_id: string;
}

interface TrainingJob {
  id: string;
  user_id: string;
  face_model_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  modal_job_id?: string;
  error_message?: string;
  credits_spent?: number;
}

// Initialize S3 client for cleanup operations
function getS3Client() {
  const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
  const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
  const region = Deno.env.get('AWS_REGION') || 'us-east-1';
  
  if (!accessKeyId || !secretAccessKey) {
    console.warn('AWS credentials not configured, S3 cleanup will be skipped');
    return null;
  }
  
  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true, // Required for some S3-compatible services
  });
}

// Cleanup function for failed face model training
async function cleanupFailedFaceModel(supabase: any, faceModelId: string, userId: string): Promise<void> {
  console.log(`🧹 Starting cleanup for failed face model: ${faceModelId}`);
  
  try {
    // 1. Delete all images from S3 for this face model
    console.log(`🧹 Step 1: Deleting S3 images for face model: ${faceModelId}`);
    await deleteS3FaceModelFolder(faceModelId);
    
    // 2. Delete all image records from database using service role permissions
    console.log(`🧹 Step 2: Deleting image records for face model: ${faceModelId}`);
    const { data: deletedImages, error: imagesDeleteError } = await supabase
      .from('images')
      .delete()
      .eq('face_model_id', faceModelId)
      .eq('user_id', userId)
      .select('id'); // Select to see what was deleted
    
    if (imagesDeleteError) {
      console.error('❌ Failed to delete image records:', {
        error: imagesDeleteError,
        code: imagesDeleteError.code,
        message: imagesDeleteError.message,
        details: imagesDeleteError.details,
        hint: imagesDeleteError.hint
      });
      // Continue with cleanup even if this fails
    } else {
      console.log(`✅ Deleted ${deletedImages?.length || 0} image records for face model: ${faceModelId}`);
    }
    
    // 3. Soft delete the face model record instead of hard delete
    console.log(`🧹 Step 3: Soft deleting face model: ${faceModelId}`);
    const { error: faceModelDeleteError } = await supabase
      .from('face_models')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', faceModelId)
      .eq('user_id', userId)
      .neq('status', 'deleted'); // Only soft delete non-deleted models
    
    if (faceModelDeleteError) {
      console.error('❌ Failed to soft delete face model record:', {
        error: faceModelDeleteError,
        code: faceModelDeleteError.code,
        message: faceModelDeleteError.message,
        details: faceModelDeleteError.details,
        hint: faceModelDeleteError.hint
      });
      // Continue with cleanup even if this fails
    } else {
      console.log(`✅ Soft deleted face model record: ${faceModelId}`);
    }
    
    console.log(`🧹 Cleanup completed for face model: ${faceModelId}`);
    
  } catch (error) {
    console.error(`❌ Error during face model cleanup for ${faceModelId}:`, error);
    // Don't throw - we want to continue with the error response
  }
}

// Delete entire face model folder from S3
async function deleteS3FaceModelFolder(faceModelId: string): Promise<void> {
  const bucketName = Deno.env.get('AWS_S3_BUCKET');
  if (!bucketName) {
    console.error('❌ AWS_S3_BUCKET environment variable not set - skipping S3 cleanup');
    return;
  }
  
  const s3Client = getS3Client();
  if (!s3Client) {
    console.error('❌ S3 client not available (AWS credentials not configured) - skipping S3 cleanup');
    return;
  }
  
  const folderPrefix = `user-images/${faceModelId}/`;
  
  try {
    // List all objects in the face model folder
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: folderPrefix,
    });
    
    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log(`No S3 objects found for face model folder: ${folderPrefix}`);
      return;
    }
    
    // Prepare objects for deletion
    const objectsToDelete = listResponse.Contents.map(obj => ({ Key: obj.Key! }));
    
    // Delete all objects in the folder
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: objectsToDelete,
        Quiet: false,
      },
    });
    
    const deleteResponse = await s3Client.send(deleteCommand);
    
    if (deleteResponse.Deleted && deleteResponse.Deleted.length > 0) {
      console.log(`✅ Deleted ${deleteResponse.Deleted.length} S3 objects for face model: ${faceModelId}`);
    }
    
    if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
      console.error(`❌ Failed to delete some S3 objects:`, deleteResponse.Errors);
    }
    
  } catch (error) {
    console.error(`❌ Error deleting S3 folder for face model ${faceModelId}:`, error);
    // Don't throw - we want to continue with other cleanup
  }
}

// Check user's subscription and training limits
async function checkTrainingLimits(
  supabase: any, 
  userId: string
): Promise<{ 
  allowed: boolean; 
  reason?: string; 
  faceModelTrainingIncluded?: number;
  currentTrainingCount?: number;
  concurrentJobs?: number;
  currentRunningJobs?: number;
  noActiveSubscription?: boolean;
  concurrentLimitReached?: boolean;
}> {
  // Get user's active subscription with billing period information
  const { data: subscription, error } = await supabase
    .from('user_subscriptions')
    .select('plan_name, current_period_start, current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !subscription) {
    // No active subscription - not allowed to train
    console.log(`No active subscription found for user ${userId}:`, error);
    return { 
      allowed: false, 
      reason: 'Active subscription required for Face Model training',
      noActiveSubscription: true
    };
  }

  // Get plan details from database instead of Stripe
  try {
    const limits = await getSubscriptionLimits(supabase, subscription.plan_name);
    
    if (!limits) {
      console.error(`Failed to get subscription limits for plan: ${subscription.plan_name}`);
      return { allowed: false, reason: 'Failed to verify subscription limits' };
    }

    const faceModelTrainingIncluded = limits.face_model_training_included;
    const concurrentJobs = limits.concurrent_jobs;

    // Calculate current billing period start - use subscription data with fallback
    const currentPeriodStart = subscription.current_period_start 
      ? new Date(subscription.current_period_start)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // fallback to 30 days ago

    console.log(`Face Model training limits check for user ${userId}:`, {
      faceModelTrainingIncluded,
      currentPeriodStart: currentPeriodStart.toISOString(),
      billingPeriod: subscription.current_period_start ? 'from_subscription' : 'fallback',
      plan: subscription.plan_name
    });
    
    // Check how many Face Model trainings user has used this billing cycle
    // Count all training jobs that have started (queued, running, completed)
    // since the user has consumed their included quota once training begins
    const { count: trainingCount } = await supabase
      .from('training_jobs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .in('status', ['queued', 'running', 'completed'])
      .gte('created_at', currentPeriodStart.toISOString());

    const currentTrainingCount = trainingCount || 0;

    console.log(`Training usage for user ${userId}: ${currentTrainingCount}/${faceModelTrainingIncluded} completed trainings in current billing period`);

    // Do NOT block for quota here. Only block for concurrent jobs below.

    // Check concurrent job limits
    const { count: runningJobs } = await supabase
      .from('training_jobs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'running');

    const currentRunningJobs = runningJobs || 0;

    if (currentRunningJobs >= concurrentJobs) {
      console.log(`Concurrent job limit reached for user ${userId}: ${currentRunningJobs}/${concurrentJobs}`);
      return {
        allowed: false,
        reason: `Concurrent job limit reached (${currentRunningJobs}/${concurrentJobs})`,
        faceModelTrainingIncluded,
        currentTrainingCount,
        concurrentJobs,
        currentRunningJobs,
        concurrentLimitReached: true
      };
    }

    return {
      allowed: true,
      faceModelTrainingIncluded,
      currentTrainingCount,
      concurrentJobs,
      currentRunningJobs
    };

  } catch (error) {
    console.error('Error checking training limits:', error);
    return { allowed: false, reason: 'Failed to verify subscription limits' };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const env = Deno.env.get('ENV') ?? 'prod';

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: TrainingRequest = await req.json();
    const { user_id, face_model_id } = body;

    // Validate required fields
    if (!user_id || !face_model_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, face_model_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check subscription training limits first to know if this training counts towards included quota
    const trainingLimitsCheck = await checkTrainingLimits(supabase, user_id);
    if (!trainingLimitsCheck.allowed) {
      // Only block if no subscription or concurrent job limit
      if (trainingLimitsCheck.noActiveSubscription) {
        return new Response(
          JSON.stringify({
            error: 'Training not allowed',
            details: trainingLimitsCheck.reason,
            training_limits: {
              face_model_training_included: trainingLimitsCheck.faceModelTrainingIncluded,
              current_training_count: trainingLimitsCheck.currentTrainingCount,
              concurrent_jobs: trainingLimitsCheck.concurrentJobs,
              current_running_jobs: trainingLimitsCheck.currentRunningJobs
            }
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (trainingLimitsCheck.concurrentLimitReached) {
        return new Response(
          JSON.stringify({
            error: 'Concurrent job limit reached',
            details: trainingLimitsCheck.reason,
            training_limits: {
              face_model_training_included: trainingLimitsCheck.faceModelTrainingIncluded,
              current_training_count: trainingLimitsCheck.currentTrainingCount,
              concurrent_jobs: trainingLimitsCheck.concurrentJobs,
              current_running_jobs: trainingLimitsCheck.currentRunningJobs
            }
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Determine cost after considering included training quota
    const baseFaceModelTrainingCost = await getFaceModelTrainingCost(supabase);
    let trainingCost = baseFaceModelTrainingCost;
    if (
      typeof trainingLimitsCheck.faceModelTrainingIncluded === 'number' &&
      typeof trainingLimitsCheck.currentTrainingCount === 'number' &&
      trainingLimitsCheck.currentTrainingCount < trainingLimitsCheck.faceModelTrainingIncluded
    ) {
      // Within included allowance: this training is free
      trainingCost = 0;
    }

    console.log(`Face Model training cost calculation for user ${user_id}:`, {
      baseCost: baseFaceModelTrainingCost,
      finalCost: trainingCost,
      remainingIncluded: trainingLimitsCheck.faceModelTrainingIncluded! - trainingLimitsCheck.currentTrainingCount!,
      isFree: trainingCost === 0
    });

    let currentBalance = 0;

    if (trainingCost > 0) {
      // Check user's credit balance for paid training
      const { data: balanceData, error: balanceError } = await supabase.rpc(
        'get_user_available_credits',
        { user_uuid: user_id }
      );

      if (balanceError) {
        console.error('Error getting user credit balance:', balanceError);
        return new Response(
          JSON.stringify({ error: 'Failed to check credit balance' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      currentBalance = balanceData || 0;

      if (currentBalance < trainingCost) {
        return new Response(
          JSON.stringify({
            error: 'Insufficient credits for Face Model training',
            details: `Required: ${trainingCost} credits.`,
            required_credits: trainingCost,
            available_credits: currentBalance,
          }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Verify user owns the face model
    console.log(`🔍 Looking for face model: ${face_model_id}, user_id: ${user_id}`);
    
    const { data: faceModel, error: faceModelError } = await supabase
      .from('face_models')
      .select('id, user_id, status')
      .eq('id', face_model_id)
      .eq('user_id', user_id)
      .neq('status', 'deleted') // Only allow training on non-deleted face models
      .single();

    console.log(`👤 Face model query result:`, { faceModel, faceModelError });

    if (faceModelError || !faceModel) {
      console.error(`❌ Face model not found:`, { faceModelError, faceModel });
      return new Response(
        JSON.stringify({ error: 'Face model not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if face model is already being trained or completed
    if (faceModel.status === 'training' || faceModel.status === 'ready') {
      console.log(`⚠️ Face model already ${faceModel.status}`);
      return new Response(
        JSON.stringify({ error: `Face model is already ${faceModel.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Spend credits BEFORE starting the training job (non-refundable) if cost > 0
    if (trainingCost > 0) {
      const { data: spendResult, error: spendError } = await supabase.rpc(
        'spend_user_credits',
        {
          p_user_id: user_id,
          p_amount: trainingCost,
          p_usage_type: 'face_model_training',
          p_description: `Face model training`,
          p_metadata: {
            face_model_id,
          },
        },
      );

      if (spendError || !spendResult) {
        console.error('Failed to spend credits:', spendError);
        return new Response(
          JSON.stringify({ error: 'Failed to spend credits' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Generate job ID 
    const jobId = crypto.randomUUID();
    console.log(`🆔 Generated job ID: ${jobId}`);

    // Create training job record with credits spent
    const trainingJob: Partial<TrainingJob> = {
      id: jobId,
      user_id,
      face_model_id,
      status: 'queued',
      credits_spent: trainingCost,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`💾 Inserting training job:`, trainingJob);

    const { error: insertError } = await supabase
      .from('training_jobs')
      .insert(trainingJob);

    if (insertError) {
      console.error('❌ Failed to create training job:', insertError);
      
      // Refund credits if job creation failed with idempotency protection
      const idempotencyKey = `refund_${jobId}`;
      const { data: refundResult, error: refundError } = await supabase
        .rpc('refund_credits_with_idempotency', {
          p_user_id: user_id,
          p_job_id: jobId,
          p_amount: trainingCost,
          p_reason: `Refund for failed LoRA training job creation`,
          p_idempotency_key: idempotencyKey
        });

      if (refundError) {
        console.error('Failed to process refund:', refundError);
        // Continue with error response even if refund failed - this is logged for manual review
      } else if (refundResult?.[0]?.success) {
        console.log(`Refund processed for training job ${jobId}: ${refundResult[0].refund_created ? 'new' : 'duplicate'} refund`);
      }

      // Clean up the failed face model since job creation failed
      await cleanupFailedFaceModel(supabase, face_model_id, user_id);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to create training job',
          details: insertError.message,
          code: insertError.code,
          cleanup_performed: true
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Training job created successfully`);

    // Update face model status to training
    console.log(`🔄 Updating face model status to training`);
    await supabase
      .from('face_models')
      .update({ 
        status: 'training',
        updated_at: new Date().toISOString()
      })
      .eq('id', face_model_id);

    // Prepare Modal API call
    const modalPayload = {
      user_id,
      face_model_id,
      job_id: jobId,
      env: env
    };

    console.log('🚀 Starting real Modal training job:', modalPayload);

    try {
      const trainingUrl = Deno.env.get('TRAINING_API_URL'); 

      if (!trainingUrl) {  
        throw new Error('TRAINING_API_URL env variable is not configured');  
      } 
      
      const modalResponse = await fetch(trainingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Modal-Key': Deno.env.get('MODAL_TOKEN_ID') || '',
          'Modal-Secret': Deno.env.get('MODAL_TOKEN_SECRET') || ''
        },
        body: JSON.stringify(modalPayload)
      });

      if (!modalResponse.ok) {
        const errorText = await modalResponse.text();
        throw new Error(`Modal API error: ${modalResponse.status} - ${errorText}`);
      }

      const modalResult = await modalResponse.json();
      console.log('✅ Modal training started:', modalResult);

      // Update job with Modal job ID if provided
      const modalJobId = modalResult.job_handle || modalResult.modal_job_id;
      if (modalJobId) {
        await supabase
          .from('training_jobs')
          .update({ 
            modal_job_id: modalJobId,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      }

      return new Response(
        JSON.stringify({
          job_id: jobId,
          ...modalResult,
          credits_spent: trainingCost,
          remaining_credits: currentBalance - trainingCost,
          training_limits: {
            used: trainingLimitsCheck.currentTrainingCount + 1,
            included: trainingLimitsCheck.faceModelTrainingIncluded,
            concurrent_running: trainingLimitsCheck.currentRunningJobs + 1,
            concurrent_limit: trainingLimitsCheck.concurrentJobs
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (modalError) {
      console.error('❌ Modal API call failed:', modalError);
      
      // Update job status to failed
      await supabase
        .from('training_jobs')
        .update({
          status: 'failed',
          error_message: modalError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      // Clean up the failed face model (S3 images, database records, face model)
      await cleanupFailedFaceModel(supabase, face_model_id, user_id);

      // Refund credits since training never actually started (Modal API failed)
      if (trainingCost > 0) {
        const refundIdempotencyKey = `modal_failure_refund_${jobId}`;
        const { data: refundResult, error: refundError } = await supabase
          .rpc('refund_credits_with_idempotency', {
            p_user_id: user_id,
            p_job_id: jobId,
            p_amount: trainingCost,
            p_reason: `Refund for failed training start: ${modalError.message}`,
            p_idempotency_key: refundIdempotencyKey
          });

        if (refundError) {
          console.error('❌ Failed to process credit refund:', refundError);
          // Continue with error response even if refund failed - this is logged for manual review
        } else if (refundResult?.[0]?.success) {
          console.log(`✅ Refund processed for training job ${jobId}: ${refundResult[0].refund_created ? 'new' : 'duplicate'} refund of ${trainingCost} credits`);
        }
      }

      return new Response(
        JSON.stringify({ 
          error: 'Failed to start training on Modal',
          details: modalError.message,
          job_id: jobId,
          credits_spent: trainingCost,
          credits_refunded: trainingCost,
          cleanup_performed: true
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Training start error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 