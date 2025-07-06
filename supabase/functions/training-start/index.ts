import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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

// LoRA training cost - 30 credits per training according to PRICING.md
const LORA_TRAINING_COST = 30;

// Check user's subscription and training limits
async function checkTrainingLimits(
  supabase: any, 
  userId: string
): Promise<{ 
  allowed: boolean; 
  reason?: string; 
  loraTrainingIncluded?: number;
  currentTrainingCount?: number;
  concurrentJobs?: number;
  currentRunningJobs?: number;
}> {
  // Get user's active subscription
  const { data: subscription, error } = await supabase
    .from('user_subscriptions')
    .select('plan_name, stripe_price_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !subscription) {
    // No active subscription - not allowed to train
    return { 
      allowed: false, 
      reason: 'Active subscription required for LoRA training' 
    };
  }

  // Get plan details from Stripe
  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not found');
      return { allowed: false, reason: 'Configuration error' };
    }

    const response = await fetch(`https://api.stripe.com/v1/prices/${subscription.stripe_price_id}?expand[]=product`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch Stripe price details');
      return { allowed: false, reason: 'Failed to verify subscription' };
    }

    const priceData = await response.json();
    const metadata = priceData.product.metadata;
    
    const loraTrainingIncluded = parseInt(metadata.lora_training_included || '0');
    const concurrentJobs = parseInt(metadata.concurrent_jobs || '1');

    // Check how many LoRA trainings user has used this billing cycle
    const currentPeriodStart = subscription.current_period_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // fallback to 30 days ago
    
    const { count: trainingCount } = await supabase
      .from('training_jobs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', currentPeriodStart);

    const currentTrainingCount = trainingCount || 0;

    if (currentTrainingCount >= loraTrainingIncluded) {
      return {
        allowed: false,
        reason: `Monthly LoRA training limit reached (${currentTrainingCount}/${loraTrainingIncluded})`,
        loraTrainingIncluded,
        currentTrainingCount
      };
    }

    // Check concurrent job limits
    const { count: runningJobs } = await supabase
      .from('training_jobs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'running');

    const currentRunningJobs = runningJobs || 0;

    if (currentRunningJobs >= concurrentJobs) {
      return {
        allowed: false,
        reason: `Concurrent job limit reached (${currentRunningJobs}/${concurrentJobs})`,
        concurrentJobs,
        currentRunningJobs
      };
    }

    return {
      allowed: true,
      loraTrainingIncluded,
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

    // Check user's credit balance for LoRA training
    const { data: balanceData, error: balanceError } = await supabase
      .rpc('get_user_credit_balance', { p_user_id: user_id });

    if (balanceError) {
      console.error('Error getting user credit balance:', balanceError);
      return new Response(
        JSON.stringify({ error: 'Failed to check credit balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentBalance = balanceData || 0;

    if (currentBalance < LORA_TRAINING_COST) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits for LoRA training',
          details: `Required: ${LORA_TRAINING_COST} credits, Available: ${currentBalance} credits`,
          required_credits: LORA_TRAINING_COST,
          available_credits: currentBalance
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check subscription training limits
    const trainingLimitsCheck = await checkTrainingLimits(supabase, user_id);
    if (!trainingLimitsCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Training not allowed',
          details: trainingLimitsCheck.reason,
          training_limits: {
            lora_training_included: trainingLimitsCheck.loraTrainingIncluded,
            current_training_count: trainingLimitsCheck.currentTrainingCount,
            concurrent_jobs: trainingLimitsCheck.concurrentJobs,
            current_running_jobs: trainingLimitsCheck.currentRunningJobs
          }
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns the face model
    console.log(`🔍 Looking for face model: ${face_model_id}, user_id: ${user_id}`);
    
    const { data: faceModel, error: faceModelError } = await supabase
      .from('face_models')
      .select('id, user_id, status')
      .eq('id', face_model_id)
      .eq('user_id', user_id)
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

    // Spend credits BEFORE starting the training job (non-refundable)
    const { data: spendResult, error: spendError } = await supabase
      .rpc('spend_user_credits', {
        p_user_id: user_id,
        p_amount: LORA_TRAINING_COST,
        p_usage_type: 'lora_training',
        p_description: `LoRA face model training`,
        p_metadata: {
          face_model_id,
          training_type: 'lora'
        }
      });

    if (spendError || !spendResult) {
      console.error('Error spending credits:', spendError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to spend credits',
          details: 'Insufficient balance or system error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      credits_spent: LORA_TRAINING_COST,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`💾 Inserting training job:`, trainingJob);

    const { error: insertError } = await supabase
      .from('training_jobs')
      .insert(trainingJob);

    if (insertError) {
      console.error('❌ Failed to create training job:', insertError);
      
      // Refund credits if job creation failed
      await supabase
        .from('user_credits')
        .insert({
          user_id,
          credits: LORA_TRAINING_COST,
          transaction_type: 'earned',
          source_type: 'refund',
          source_id: jobId,
          description: `Refund for failed LoRA training job creation`,
          metadata: { original_job_id: jobId, reason: 'job_creation_failed' }
        });

      return new Response(
        JSON.stringify({ 
          error: 'Failed to create training job',
          details: insertError.message,
          code: insertError.code
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
      // Call real Modal API - using HTTPS endpoint
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
          ...modalResult,
          credits_spent: LORA_TRAINING_COST,
          remaining_credits: currentBalance - LORA_TRAINING_COST,
          training_limits: {
            used: trainingLimitsCheck.currentTrainingCount + 1,
            included: trainingLimitsCheck.loraTrainingIncluded,
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

      // Update face model status back to queued
      await supabase
        .from('face_models')
        .update({ 
          status: 'queued',
          updated_at: new Date().toISOString()
        })
        .eq('id', face_model_id);

      // Note: We don't refund credits here as the training was attempted

      return new Response(
        JSON.stringify({ 
          error: 'Failed to start training on Modal',
          details: modalError.message,
          job_id: jobId,
          credits_spent: LORA_TRAINING_COST
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