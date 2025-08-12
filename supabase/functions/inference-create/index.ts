import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { calculateImageCreditCost, getSubscriptionLimits, type Quality } from "../_shared/pricing.ts";

interface InferenceRequest {
  user_id: string;
  character_id: string;
  style_id: string;
  wardrobe_id?: string;
  color_id?: string;
  scene_id?: string;
  params?: Record<string, unknown>; // seed?, quality, nb_takes, aspect_ratio
  queue_type?: 'fast' | 'slow' | 'ultra';
}

interface InferenceJob {
  id: string;
  user_id: string;
  style_id: string;
  status: 'initializing' | 'queued' | 'pending' | 'completed' | 'failed';
  progress: number;
  modal_job_id?: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
  wardrobe_id?: string;
  scene_id?: string;
  color_id?: string;
  character_id: string;
  credits_spent?: number;
}

// Credit calculation function - now uses shared configuration

// Check if user can generate at requested quality based on their subscription
async function checkQualityPermission(
  supabase: any, 
  userId: string, 
  requestedQuality: '1K' | '2K' | '4K'
): Promise<{ allowed: boolean; maxQuality?: string; userTier?: string }> {
  // Get user's active subscription
  const { data: subscription, error } = await supabase
    .from('user_subscriptions')
    .select('plan_name')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !subscription) {
    // No active subscription - only allow 1K
    return { allowed: requestedQuality === '1K', maxQuality: '1K', userTier: 'none' };
  }

  // Get plan details from database instead of Stripe
  try {
    const limits = await getSubscriptionLimits(supabase, subscription.plan_name);
    
    if (!limits) {
      console.error(`Failed to get subscription limits for plan: ${subscription.plan_name}`);
      return { allowed: false };
    }

    const maxQuality = limits.max_quality;
    
    const qualityHierarchy = { '1K': 1, '2K': 2, '4K': 3 };
    const userMaxLevel = qualityHierarchy[maxQuality as keyof typeof qualityHierarchy] || 1;
    const requestedLevel = qualityHierarchy[requestedQuality];

    return {
      allowed: requestedLevel <= userMaxLevel,
      maxQuality,
      userTier: subscription.plan_name
    };
  } catch (error) {
    console.error('Error checking quality permission:', error);
    return { allowed: false };
  }
}

// Check user's concurrent inference limits based on subscription plan
async function checkInferenceConcurrentLimits(
  supabase: any,
  userId: string
): Promise<{
  allowed: boolean;
  reason?: string;
  concurrentJobs?: number;
  currentRunningJobs?: number;
}> {
  try {
    // Get user's active subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('plan_name')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // Default to 1 concurrent job for users without an active subscription
    let concurrentJobs = 1;

    if (subscription?.plan_name) {
      const limits = await getSubscriptionLimits(supabase, subscription.plan_name);
      if (limits?.concurrent_jobs) {
        concurrentJobs = limits.concurrent_jobs;
      }
    }

    // Count user's currently active inference jobs (pending or running)
    const { count: runningCount } = await supabase
      .from('inference_jobs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .in('status', ['initializing', 'pending', 'running']);

    const currentRunningJobs = runningCount || 0;

    if (currentRunningJobs >= concurrentJobs) {
      return {
        allowed: false,
        reason: `Concurrent inference limit reached (${currentRunningJobs}/${concurrentJobs})`,
        concurrentJobs,
        currentRunningJobs,
      };
    }

    return { allowed: true, concurrentJobs, currentRunningJobs };
  } catch (error) {
    console.error('Error checking inference concurrent limits:', error);
    // Fail-safe: allow but with reason set
    return { allowed: true, reason: 'Failed to verify concurrent limits' };
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
    const body: InferenceRequest = await req.json();
    const { user_id, character_id, style_id } = body;

    // Validate required fields
    if (!user_id || !character_id || !style_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, character_id, and style_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract params/settings
    const quality = (body.params as any)?.quality || '1K';
    const nbTakes = (body.params as any)?.nb_takes || 5;
    const aspectRatio = (body.params as any)?.aspect_ratio || '1:1';
    const queueType: 'fast' | 'slow' = body.queue_type === 'slow' ? 'slow' : 'fast';

    // Validate batch_size limits
    if (!Number.isInteger(nbTakes) || nbTakes < 5 || nbTakes > 20) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid batch_size',
          details: 'batch_size must be an integer between 5 and 20',
          provided_number_of_takes: nbTakes
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate credit cost for this operation
    const creditCost = await calculateImageCreditCost(supabase, quality as Quality, nbTakes);

    // Check user's credit balance
    const { data: balanceData, error: balanceError } = await supabase
      .rpc('get_user_available_credits', { user_uuid: user_id });

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

    const currentBalance = balanceData || 0;

    if (currentBalance < creditCost) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits',
          details: `Required: ${creditCost} credits, Available: ${currentBalance} credits`,
          required_credits: creditCost,
          available_credits: currentBalance
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check resolution permission based on user's subscription
    const qualityCheck = await checkQualityPermission(supabase, user_id, quality);
    if (!qualityCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: `Quality ${quality} not allowed for your subscription tier`,
          details: `Your plan allows up to ${qualityCheck.maxQuality} quality`,
          max_allowed_quality: qualityCheck.maxQuality,
          user_tier: qualityCheck.userTier
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns the character and it's ready for inference
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('id, user_id, status, lora_path')
      .eq('id', character_id)
      .eq('user_id', user_id)
      .eq('status', 'ready') // Only allow inference on ready characters
      .single();

    if (characterError || !character) {
      return new Response(
        JSON.stringify({ error: 'Character not found, not ready, or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get style configuration from the styles table
    const { data: style, error: styleError } = await supabase
      .from('styles')
      .select('*')
      .eq('id', style_id)
      .single();

    if (styleError || !style) {
      return new Response(
        JSON.stringify({ error: 'Style not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Spend credits BEFORE starting the job (non-refundable)
    const { data: spendResult, error: spendError } = await supabase
      .rpc('spend_user_credits', {
        p_user_id: user_id,
        p_amount: creditCost,
        p_usage_type: 'image_generation',
        p_description: `Image generation - ${quality} quality, ${nbTakes} images`,
        p_metadata: {
          character_id,
          style_id,
          quality,
          nb_takes: nbTakes,
          aspect_ratio: aspectRatio,
          style_name: style.name
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

    // Determine if we need to queue based on user's concurrent limits
    const concurrentLimits = await checkInferenceConcurrentLimits(supabase, user_id);
    const shouldQueue = !concurrentLimits.allowed;

    // Create inference job record with credits spent
    const inferenceJob: Partial<InferenceJob> = {
      id: jobId,
      user_id,
      character_id,
      style_id,
      status: 'initializing',
      quality,
      nb_takes: nbTakes,
      aspect_ratio: aspectRatio,
      queue_type: queueType,
      credits_spent: creditCost,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('inference_jobs')
      .insert(inferenceJob);

    if (insertError) {
      console.error('Failed to create inference job:', insertError);
      
      // Refund credits if job creation failed with idempotency protection
      const idempotencyKey = `refund_${jobId}`;
      const { data: refundResult, error: refundError } = await supabase
        .rpc('refund_credits_with_idempotency', {
          p_user_id: user_id,
          p_job_id: jobId,
          p_amount: creditCost,
          p_reason: `Refund for failed job creation - ${quality} quality`,
          p_idempotency_key: idempotencyKey
        });

      if (refundError) {
        console.error('Failed to process refund:', refundError);
        // Continue with error response even if refund failed - this is logged for manual review
      } else if (refundResult?.[0]?.success) {
        console.log(`Refund processed for job ${jobId}: ${refundResult[0].refund_created ? 'new' : 'duplicate'} refund`);
      }

      return new Response(
        JSON.stringify({ error: 'Failed to create inference job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (shouldQueue) {
      // Update status to queued when enqueued due to user concurrent limit
      await supabase
        .from('inference_jobs')
        .update({ status: 'queued', updated_at: new Date().toISOString() })
        .eq('id', jobId);
      console.log(`🕐 Inference job ${jobId} queued due to per-user concurrent limit`);
      return new Response(
        JSON.stringify({
          job_id: jobId,
          status: 'queued',
          credits_spent: creditCost,
          remaining_credits: currentBalance - creditCost,
          queue_info: {
            current_running_jobs: concurrentLimits.currentRunningJobs,
            concurrent_jobs: concurrentLimits.concurrentJobs,
          },
          message: 'Inference queued. It will start automatically when a slot becomes available.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Modal ComfyUI API for real inference (Option B payload)
    try {
      const slowUrl = Deno.env.get('INFERENCE_SLOW_API_URL');
      const defaultUrl = Deno.env.get('INFERENCE_API_URL');
      const inferenceApiUrl = queueType === 'slow' ? (slowUrl || defaultUrl) : defaultUrl;
      if (!inferenceApiUrl) {
        throw new Error('INFERENCE_API_URL environment variable not set');
      }

      // Prepare Modal API request with quality and batch size
      const modalRequest = {
        user_id,
        job_id: jobId,
        character_id,
        style_id,
        wardrobe_id: body.wardrobe_id,
        color_id: body.color_id,
        scene_id: body.scene_id,
        params: {
          nb_takes: nbTakes,
          aspect_ratio: aspectRatio,
          quality: quality,
          seed: (body.params as any)?.seed ?? -1
        }
      } as Record<string, unknown>;

      console.log('Calling Modal ComfyUI API:', {
        url: inferenceApiUrl,
        job_id: jobId,
        user_id,
        character_id,
        style_id,
        credits_spent: creditCost,
        quality,
        nb_takes: nbTakes,
        aspect_ratio: aspectRatio,
      });

      // Get Modal authentication tokens
      const modalTokenId = Deno.env.get('MODAL_TOKEN_ID');
      const modalTokenSecret = Deno.env.get('MODAL_TOKEN_SECRET');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add Modal authentication if tokens are available
      if (modalTokenId && modalTokenSecret) {
        headers['Modal-Key'] = modalTokenId;
        headers['Modal-Secret'] = modalTokenSecret;
      }

      const modalResponse = await fetch(inferenceApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(modalRequest)
      });

      if (!modalResponse.ok) {
        const errorText = await modalResponse.text();
        console.error('Modal API error:', {
          status: modalResponse.status,
          statusText: modalResponse.statusText,
          body: errorText
        });
        
        // Update job status to failed
        await supabase
          .from('inference_jobs')
          .update({
            status: 'failed',
            error_message: `Modal API error: ${modalResponse.status} ${modalResponse.statusText}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);

        // Refund credits since the Modal start failed (idempotent)
        try {
          const refundKey = `inference_modal_failure_refund_${jobId}`;
          const { data: refundResult, error: refundError } = await supabase
            .rpc('refund_credits_with_idempotency', {
              p_user_id: user_id,
              p_job_id: jobId,
              p_amount: creditCost,
              p_reason: `Refund for failed inference start: ${modalResponse.status} ${modalResponse.statusText}`,
              p_idempotency_key: refundKey,
            });
          if (refundError) {
            console.error('Failed to process refund:', refundError);
          } else if (refundResult?.[0]?.success) {
            console.log(`Refund processed for job ${jobId}: ${refundResult[0].refund_created ? 'new' : 'duplicate'} refund`);
          } else {
            console.error('Unexpected refund result:', refundResult);
          }
        } catch (refundException) {
          console.error('Exception during refund process:', refundException);
        }

        return new Response(
          JSON.stringify({ 
            error: 'Failed to start inference on Modal',
            details: `${modalResponse.status}: ${errorText}`,
            credits_spent: creditCost,
            credits_refunded: creditCost
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark job as pending after successful submission to provider
      await supabase
        .from('inference_jobs')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', jobId);

      const modalResult = await modalResponse.json();
      console.log('Modal API response:', modalResult);

      // Update job with Modal job ID if provided, but keep status 'pending'
      if (modalResult.style_id) {
        await supabase
          .from('inference_jobs')
          .update({
            modal_job_id: modalResult.style_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      }

      return new Response(
        JSON.stringify({
          job_id: jobId,
          modal_job_id: modalResult.style_id,
          status: 'pending',
          estimated_duration: 45, // TODO: Update when provider exposes
          credits_spent: creditCost,
          remaining_credits: currentBalance - creditCost,
          quality: quality,
          nb_takes: nbTakes,
          aspect_ratio: aspectRatio,
          queue_type: queueType,
          message: 'Inference submitted to provider and is pending execution'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (modalError) {
      const errorMessage = (modalError as any)?.message ?? String(modalError);
      console.error('Modal API call failed:', modalError);
      
      // Update job status to failed
      await supabase
        .from('inference_jobs')
        .update({
          status: 'failed',
          error_message: `Failed to call Modal API: ${errorMessage}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      // Refund credits since the Modal call failed (idempotent)
      try {
        const refundKey = `inference_modal_failure_refund_${jobId}`;
        const { data: refundResult, error: refundError } = await supabase
          .rpc('refund_credits_with_idempotency', {
            p_user_id: user_id,
            p_job_id: jobId,
            p_amount: creditCost,
            p_reason: `Refund for failed inference start: ${errorMessage}`,
            p_idempotency_key: refundKey,
          });
        if (refundError) {
          console.error('Failed to process refund:', refundError);
        } else if (refundResult?.[0]?.success) {
          console.log(`Refund processed for job ${jobId}: ${refundResult[0].refund_created ? 'new' : 'duplicate'} refund`);
        } else {
          console.error('Unexpected refund result:', refundResult);
        }
      } catch (refundException) {
        console.error('Exception during refund process:', refundException);
      }

      return new Response(
        JSON.stringify({ 
          error: 'Failed to start inference',
          details: errorMessage,
          credits_spent: creditCost,
          credits_refunded: creditCost
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Inference start error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 