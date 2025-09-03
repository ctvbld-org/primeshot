import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getCharacterTrainingCost, getSubscriptionLimits } from "../_shared/pricing.ts";

// S3 Client for cleanup operations
import { S3Client, DeleteObjectsCommand, ListObjectsV2Command } from "https://esm.sh/@aws-sdk/client-s3@3";

interface TrainingRequest {
  user_id: string;
  character_id: string;
  training_params?: {
    steps?: number;
    batch_size?: number;
    resize_size?: number;
    rank?: number;
  };
}

interface TrainingJob {
  id: string;
  user_id: string;
  character_id: string;
  status: 'initializing' | 'queued' | 'pending' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  modal_job_id?: string;
  error_message?: string;
  credits_spent?: number;
}

// Find an existing active training job for idempotency (initializing/queued/pending/running)
async function findExistingActiveJob(
  supabase: any,
  userId: string,
  characterId: string
): Promise<TrainingJob | null> {
  const { data, error } = await supabase
    .from('training_jobs')
    .select('id, user_id, character_id, status, modal_job_id, created_at, updated_at, credits_spent, error_message, gpu_type')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .in('status', ['initializing', 'queued', 'pending', 'running'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking existing active job:', error);
    return null;
  }
  return data || null;
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

// Cleanup function for failed character training
async function cleanupFailedCharacter(supabase: any, characterId: string, userId: string): Promise<void> {
  console.log(`🧹 Starting cleanup for failed character: ${characterId}`);
  
  try {
    // 1. Delete all images from S3 for this character
    console.log(`🧹 Step 1: Deleting S3 images for character: ${characterId}`);
    await deleteS3CharacterFolder(userId, characterId);
    
    // 2. Delete all image records from database using service role permissions
    console.log(`🧹 Step 2: Deleting image records for character: ${characterId}`);
    const { data: deletedImages, error: imagesDeleteError } = await supabase
      .from('uploaded_images')
      .delete()
      .eq('character_id', characterId)
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
      console.log(`✅ Deleted ${deletedImages?.length || 0} image records for character: ${characterId}`);
    }
    
    // 3. Soft delete the character record instead of hard delete
    console.log(`🧹 Step 3: Soft deleting character: ${characterId}`);
    const { error: characterDeleteError } = await supabase
      .from('characters')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', characterId)
      .eq('user_id', userId)
      .neq('status', 'deleted'); // Only soft delete non-deleted models
    
    if (characterDeleteError) {
      console.error('❌ Failed to soft delete character record:', {
        error: characterDeleteError,
        code: characterDeleteError.code,
        message: characterDeleteError.message,
        details: characterDeleteError.details,
        hint: characterDeleteError.hint
      });
      // Continue with cleanup even if this fails
    } else {
      console.log(`✅ Soft deleted character record: ${characterId}`);
    }
    
    console.log(`🧹 Cleanup completed for character: ${characterId}`);
    
  } catch (error) {
    console.error(`❌ Error during character cleanup for ${characterId}:`, error);
    // Don't throw - we want to continue with the error response
  }
}

// Delete entire character folder from S3
async function deleteS3CharacterFolder(userId: string, characterId: string): Promise<void> {
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
  
  const folderPrefix = `user-images/${userId}/training/${characterId}/`;
  
  try {
    // List all objects in the character folder
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: folderPrefix,
    });
    
    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log(`No S3 objects found for character folder: ${folderPrefix}`);
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
      console.log(`✅ Deleted ${deleteResponse.Deleted.length} S3 objects for character: ${characterId}`);
    }
    
    if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
      console.error(`❌ Failed to delete some S3 objects:`, deleteResponse.Errors);
    }
    
  } catch (error) {
    console.error(`❌ Error deleting S3 folder for character ${characterId}:`, error);
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
  characterTrainingIncluded?: number;
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
      reason: 'Active subscription required for Character training',
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

    const characterTrainingIncluded = limits.character_training_included;
    const concurrentJobs = limits.concurrent_trainings ?? 2;

    // Calculate current billing period start - use subscription data with fallback
    const currentPeriodStart = subscription.current_period_start 
      ? new Date(subscription.current_period_start)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // fallback to 30 days ago

    console.log(`Character training limits check for user ${userId}:`, {
      characterTrainingIncluded,
      currentPeriodStart: currentPeriodStart.toISOString(),
      billingPeriod: subscription.current_period_start ? 'from_subscription' : 'fallback',
      plan: subscription.plan_name
    });
    
    // Check how many Character trainings user has used this billing cycle
    // Count all training jobs that have started (initializing, queued, pending, running, completed)
    // since the user has consumed their included quota once training begins
    const { count: trainingCount } = await supabase
      .from('training_jobs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .in('status', ['initializing', 'queued', 'pending', 'running', 'completed'])
      .gte('created_at', currentPeriodStart.toISOString());

    const currentTrainingCount = trainingCount || 0;

    console.log(`Training usage for user ${userId}: ${currentTrainingCount}/${characterTrainingIncluded} completed trainings in current billing period`);

    // Do NOT block for quota here. Only block for concurrent jobs below.

    // Check concurrent job limits (include initializing to prevent race)
    const { count: runningJobs } = await supabase
      .from('training_jobs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .in('status', ['initializing', 'pending', 'running']);

    const currentRunningJobs = runningJobs || 0;

    if (currentRunningJobs >= concurrentJobs) {
      console.log(`Concurrent job limit reached for user ${userId}: ${currentRunningJobs}/${concurrentJobs}`);
      return {
        allowed: false,
        reason: `Concurrent job limit reached (${currentRunningJobs}/${concurrentJobs})`,
        characterTrainingIncluded,
        currentTrainingCount,
        concurrentJobs,
        currentRunningJobs,
        concurrentLimitReached: true
      };
    }

    return {
      allowed: true,
      characterTrainingIncluded,
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

    // Extract JWT and validate user
    const authHeaderRaw = req.headers.get('Authorization') || ''
    const jwt = authHeaderRaw.startsWith('Bearer ')
      ? authHeaderRaw.substring('Bearer '.length)
      : authHeaderRaw

    // Verify request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: TrainingRequest = await req.json();
    const { user_id, character_id, training_params } = body;

    // Validate required fields
    if (!user_id || !character_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, character_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT belongs to the provided user_id (prevents client spoofing)
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser(jwt)
      if (authError || !authData?.user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (authData.user.id !== user_id) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (_e) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine if user is admin (server-side authority)
    let isAdmin = false
    try {
      const { data: usr } = await supabase
        .from('users')
        .select('admin')
        .eq('id', user_id)
        .single()
      isAdmin = Boolean(usr?.admin)
    } catch (_e) {
      isAdmin = false
    }

    // Sanitize optional admin-only params
    console.log('🔧 training_params (raw):', training_params)
    const approvedParams: Record<string, number> = {}
    if (isAdmin && training_params) {
      const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
      if (typeof training_params.steps === 'number') {
        approvedParams.steps = clamp(Math.floor(training_params.steps), 100, 10000)
      }
      if (typeof training_params.batch_size === 'number') {
        approvedParams.batch_size = clamp(Math.floor(training_params.batch_size), 1, 8)
      }
      if (typeof training_params.resize_size === 'number') {
        approvedParams.resize_size = clamp(Math.floor(training_params.resize_size), 512, 2048)
      }
      if (typeof training_params.rank === 'number') {
        approvedParams.rank = clamp(Math.floor(training_params.rank), 1, 256)
      }
    }
    console.log('✅ approvedParams:', approvedParams, 'isAdmin:', isAdmin)

    // Check subscription training limits first to know if this training counts towards included quota
    const trainingLimitsCheck = await checkTrainingLimits(supabase, user_id);
    // We'll force-queue if user concurrent limit is reached instead of erroring out
    let forceQueue = false;
    if (!trainingLimitsCheck.allowed) {
      if (trainingLimitsCheck.noActiveSubscription) {
        return new Response(
          JSON.stringify({
            error: 'Training not allowed',
            details: trainingLimitsCheck.reason,
            training_limits: {
              character_training_included: trainingLimitsCheck.characterTrainingIncluded,
              current_training_count: trainingLimitsCheck.currentTrainingCount,
              concurrent_jobs: trainingLimitsCheck.concurrentJobs,
              current_running_jobs: trainingLimitsCheck.currentRunningJobs
            }
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (trainingLimitsCheck.concurrentLimitReached) {
        forceQueue = true;
      }
    }

    // Determine cost after considering included training quota
    const baseCharacterTrainingCost = await getCharacterTrainingCost(supabase);
    let trainingCost = baseCharacterTrainingCost;
    if (
      typeof trainingLimitsCheck.characterTrainingIncluded === 'number' &&
      typeof trainingLimitsCheck.currentTrainingCount === 'number' &&
      trainingLimitsCheck.currentTrainingCount < trainingLimitsCheck.characterTrainingIncluded
    ) {
      // Within included allowance: this training is free
      trainingCost = 0;
    }

    console.log(`Character training cost calculation for user ${user_id}:`, {
      baseCost: baseCharacterTrainingCost,
      finalCost: trainingCost,
      remainingIncluded: trainingLimitsCheck.characterTrainingIncluded! - trainingLimitsCheck.currentTrainingCount!,
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
            error: 'Insufficient credits for Character training',
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

    // Verify user owns the character
    console.log(`🔍 Looking for character: ${character_id}, user_id: ${user_id}`);
    
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('id, user_id, status')
      .eq('id', character_id)
      .eq('user_id', user_id)
      .neq('status', 'deleted') // Only allow training on non-deleted characters
      .single();

    console.log(`👤 Character query result:`, { character, characterError });

    if (characterError || !character) {
      console.error(`❌ Character not found:`, { characterError, character });
      return new Response(
        JSON.stringify({ error: 'Character not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // IDEMPOTENCY: If a job already exists (queued/running), return it instead of failing/creating a new one
    const existingJob = await findExistingActiveJob(supabase, user_id, character_id);
    if (existingJob) {
      console.log(`🔁 Resuming existing training job ${existingJob.id} (status=${existingJob.status})`);
      // If admin provided overrides on resume, persist them so queue path uses them
      if (isAdmin && Object.keys(approvedParams).length > 0) {
        try {
          console.log(`📝 Updating training_params for existing job ${existingJob.id}:`, approvedParams);
          await supabase
            .from('training_jobs')
            .update({ training_params: approvedParams, updated_at: new Date().toISOString() })
            .eq('id', existingJob.id);
        } catch (e) {
          console.warn('Failed to persist admin training_params on existing job:', e);
        }
      }
      return new Response(
        JSON.stringify({
          job_id: existingJob.id,
          status: existingJob.status,
          modal_job_id: existingJob.modal_job_id,
          gpu_type: (existingJob as any).gpu_type ?? null,
          message: 'Existing training job found, resuming'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if character is already being trained or completed
    if (character.status === 'training') {
      console.log('⚠️ Character status is training but no active job was found - returning 409');
      return new Response(
        JSON.stringify({ error: 'Character is already training' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (character.status === 'ready') {
      console.log('⚠️ Character already ready');
      return new Response(
        JSON.stringify({ error: 'Character is already ready' }),
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
          p_usage_type: 'character_training',
          p_description: `Character training`,
          p_metadata: {
            character_id,
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
      character_id,
      status: 'initializing',
      credits_spent: trainingCost,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Persist admin-approved training params so queued jobs can use them later
      ...(Object.keys(approvedParams).length > 0 ? { training_params: approvedParams } : {})
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

      // Clean up the failed character since job creation failed
      await cleanupFailedCharacter(supabase, character_id, user_id);

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

    // If user is at their concurrent training limit, leave this job queued and return 200
    if (forceQueue) {
      await supabase
        .from('training_jobs')
        .update({ status: 'queued', updated_at: new Date().toISOString() })
        .eq('id', jobId);

      return new Response(
        JSON.stringify({
          job_id: jobId,
          character_id,
          status: 'queued',
          message: 'Concurrent training limit reached. Job queued and will start automatically.',
          training_limits: {
            concurrent_running: trainingLimitsCheck.currentRunningJobs ?? 0,
            concurrent_limit: trainingLimitsCheck.concurrentJobs ?? 2,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Post-insert per-user concurrency reconciliation to avoid race conditions:
    // If active (initializing/pending/running) exceeds user's limit, mark this
    // job as queued and return without submitting to provider.
    try {
      const userLimit = trainingLimitsCheck.concurrentJobs ?? 1;
      const { count: activeNow } = await supabase
        .from('training_jobs')
        .select('id', { count: 'exact' })
        .eq('user_id', user_id)
        .in('status', ['initializing', 'pending', 'running']);
      const activeCount = activeNow || 0;
      if (activeCount > userLimit) {
        await supabase
          .from('training_jobs')
          .update({ status: 'queued', updated_at: new Date().toISOString() })
          .eq('id', jobId);

        return new Response(
          JSON.stringify({
            job_id: jobId,
            character_id,
            status: 'queued',
            message: 'Concurrent job limit reached. Job queued and will start automatically.',
            training_limits: {
              concurrent_running: activeCount - 1,
              concurrent_limit: userLimit,
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (e) {
      console.warn('Post-insert training concurrency check failed; proceeding to submit:', e);
    }

    // Prepare Modal API call
    const modalPayload = {
      user_id,
      character_id,
      job_id: jobId,
      env: env,
      // Spread approved admin-only params
      ...approvedParams
    };
    console.log('📤 Submitting Modal payload keys:', Object.keys(modalPayload));

    console.log('🚀 Starting real Modal training job:', modalPayload);

    let controller: AbortController | null = null;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const trainingUrl = Deno.env.get('TRAINING_API_URL'); 

      if (!trainingUrl) {  
        throw new Error('TRAINING_API_URL env variable is not configured');  
      } 
      
      // Add network timeout to prevent hanging edge invocation if provider stalls
      controller = new AbortController();
      timeout = setTimeout(() => controller.abort('timeout'), 30000);

      const modalResponse = await fetch(trainingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Modal-Key': Deno.env.get('MODAL_TOKEN_ID') || '',
          'Modal-Secret': Deno.env.get('MODAL_TOKEN_SECRET') || ''
        },
        body: JSON.stringify(modalPayload),
        signal: controller!.signal
      });

      if (!modalResponse.ok) {
        const errorText = await modalResponse.text();
        throw new Error(`Modal API error: ${modalResponse.status} - ${errorText}`);
      }

      const modalResult = await modalResponse.json();
      console.log('✅ Modal training started:', modalResult);

      // Update job status to pending (provider queue) and add Modal job ID
      const modalJobId = modalResult.job_handle || modalResult.modal_job_id;
      await supabase
        .from('training_jobs')
        .update({ 
          status: 'pending',
          modal_job_id: modalJobId,
          gpu_type: modalResult.gpu_type ?? null,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      return new Response(
        JSON.stringify({
          job_id: jobId,
          ...modalResult,
          credits_spent: trainingCost,
          remaining_credits: currentBalance - trainingCost,
          training_limits: {
            used: (trainingLimitsCheck.currentTrainingCount ?? 0) + 1,
            included: trainingLimitsCheck.characterTrainingIncluded ?? 0,
            concurrent_running: (trainingLimitsCheck.currentRunningJobs ?? 0) + 1,
            concurrent_limit: trainingLimitsCheck.concurrentJobs ?? 0
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (modalError) {
      // Treat failures to call Modal as transient when 5xx/network, otherwise terminal
      const errorMessage = (modalError as any)?.message ?? String(modalError);
      console.error('❌ Modal API call failed:', modalError);

      // Compute backoff based on current retry_count
      const { data: currentJob } = await supabase
        .from('training_jobs')
        .select('retry_count')
        .eq('id', jobId)
        .single();
      const retryCount = (currentJob?.retry_count ?? 0) + 1;
      const backoffMinutes = Math.min(30, Math.max(2, Math.pow(2, retryCount))); // 2,4,8,16,30
      const retryAfter = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

      await supabase
        .from('training_jobs')
        .update({
          status: 'queued',
          error_message: errorMessage,
          retry_count: retryCount,
          retry_after: retryAfter,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      return new Response(
        JSON.stringify({
          job_id: jobId,
          status: 'queued',
          message: 'Temporary issue submitting to provider. We will retry automatically.',
          retry_after: retryAfter,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } finally {
      try {
        if (typeof timeout !== 'undefined') clearTimeout(timeout);
      } catch (_e) {
        // no-op
      }
    }

  } catch (error) {
    console.error('Training start error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 