import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { calculateImageCreditCost, type Resolution } from "../_shared/pricing.ts";

interface InferenceRequest {
  user_id: string;
  face_model_id: string;
  style_id: string;
  prompt?: string;
  settings?: {
    strength?: number;
    guidance_scale?: number;
    num_inference_steps?: number;
    resolution?: '1K' | '2K' | '4K';
    batch_size?: number;
  };
}

interface InferenceJob {
  id: string;
  user_id: string;
  face_model_id: string;
  style_id: string;
  status: 'queued' | 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  modal_job_id?: string;
  estimated_duration?: number;
  created_at: string;
  updated_at: string;
  error_message?: string;
  result_url?: string;
  prompt?: string;
  settings?: any;
  credits_spent?: number;
}

// Credit calculation function - now uses shared configuration

// Check if user can generate at requested resolution based on their subscription
async function checkResolutionPermission(
  supabase: any, 
  userId: string, 
  requestedResolution: '1K' | '2K' | '4K'
): Promise<{ allowed: boolean; maxResolution?: string; userTier?: string }> {
  // Get user's active subscription
  const { data: subscription, error } = await supabase
    .from('user_subscriptions')
    .select('plan_name, stripe_price_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !subscription) {
    // No active subscription - only allow 1K
    return { allowed: requestedResolution === '1K', maxResolution: '1K', userTier: 'none' };
  }

  // Get plan details from Stripe price metadata
  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not found');
      return { allowed: false };
    }

    const response = await fetch(`https://api.stripe.com/v1/prices/${subscription.stripe_price_id}?expand[]=product`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch Stripe price details');
      return { allowed: false };
    }

    const priceData = await response.json();
    const maxResolution = priceData.product.metadata.max_resolution || '1K';
    
    const resolutionHierarchy = { '1K': 1, '2K': 2, '4K': 3 };
    const userMaxLevel = resolutionHierarchy[maxResolution as keyof typeof resolutionHierarchy] || 1;
    const requestedLevel = resolutionHierarchy[requestedResolution];

    return {
      allowed: requestedLevel <= userMaxLevel,
      maxResolution,
      userTier: subscription.plan_name
    };
  } catch (error) {
    console.error('Error checking resolution permission:', error);
    return { allowed: false };
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
    const { user_id, face_model_id, style_id, prompt, settings } = body;

    // Validate required fields
    if (!user_id || !face_model_id || !style_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, face_model_id, and style_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract settings
    const resolution = settings?.resolution || '1K';
    const batchSize = settings?.batch_size || 1;

    // Calculate credit cost for this operation
    const creditCost = calculateImageCreditCost(resolution as Resolution, batchSize);

    // Check user's credit balance
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
    const resolutionCheck = await checkResolutionPermission(supabase, user_id, resolution);
    if (!resolutionCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: `Resolution ${resolution} not allowed for your subscription tier`,
          details: `Your plan allows up to ${resolutionCheck.maxResolution} resolution`,
          max_allowed_resolution: resolutionCheck.maxResolution,
          user_tier: resolutionCheck.userTier
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns the face model
    const { data: faceModel, error: faceModelError } = await supabase
      .from('face_models')
      .select('id, user_id, status, lora_path')
      .eq('id', face_model_id)
      .eq('user_id', user_id)
      .single();

    if (faceModelError || !faceModel) {
      return new Response(
        JSON.stringify({ error: 'Face model not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if face model is ready
    if (faceModel.status !== 'ready') {
      return new Response(
        JSON.stringify({ error: `Face model is not ready (status: ${faceModel.status})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify style exists and get style configuration
    const { data: style, error: styleError } = await supabase
      .from('styles')
      .select('id, name, is_active, lora_path, workflow_name')
      .eq('id', style_id)
      .single();

    if (styleError || !style) {
      return new Response(
        JSON.stringify({ error: 'Style not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!style.is_active) {
      return new Response(
        JSON.stringify({ error: 'Style is not available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Spend credits BEFORE starting the job (non-refundable)
    const { data: spendResult, error: spendError } = await supabase
      .rpc('spend_user_credits', {
        p_user_id: user_id,
        p_amount: creditCost,
        p_usage_type: 'image_generation',
        p_description: `Image generation - ${resolution} resolution, ${batchSize} images`,
        p_metadata: {
          face_model_id,
          style_id,
          resolution,
          batch_size: batchSize,
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

    // Create inference job record with credits spent
    const inferenceJob: Partial<InferenceJob> = {
      id: jobId,
      user_id,
      face_model_id,
      style_id,
      status: 'pending',
      progress: 0,
      estimated_duration: 45, // Default 45 seconds for inference
      prompt: prompt || `A professional photo in ${style.name} style`,
      settings: {
        ...settings,
        resolution,
        batch_size: batchSize,
        strength: settings?.strength || 0.8,
        guidance_scale: settings?.guidance_scale || 7.5,
        num_inference_steps: settings?.num_inference_steps || 30
      },
      credits_spent: creditCost,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('inference_jobs')
      .insert(inferenceJob);

    if (insertError) {
      console.error('Failed to create inference job:', insertError);
      
      // Refund credits if job creation failed
      await supabase
        .from('user_credits')
        .insert({
          user_id,
          credits: creditCost,
          transaction_type: 'earned',
          source_type: 'refund',
          source_id: jobId,
          description: `Refund for failed job creation - ${resolution} resolution`,
          metadata: { original_job_id: jobId, reason: 'job_creation_failed' }
        });

      return new Response(
        JSON.stringify({ error: 'Failed to create inference job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Modal ComfyUI API for real inference
    try {
      const inferenceApiUrl = Deno.env.get('INFERENCE_API_URL');
      if (!inferenceApiUrl) {
        throw new Error('INFERENCE_API_URL environment variable not set');
      }

      // Prepare Modal API request with resolution and batch size
      const modalRequest = {
        user_id,
        workflow_name: style.workflow_name || 'flux_lora',
        parameters: {
          prompt: inferenceJob.prompt,
          lora_path: faceModel.lora_path,
          style_lora_path: style.lora_path,
          strength: inferenceJob.settings?.strength || 0.8,
          guidance_scale: inferenceJob.settings?.guidance_scale || 7.5,
          num_inference_steps: inferenceJob.settings?.num_inference_steps || 30,
          resolution: resolution === '1K' ? '1024x1024' : 
                     resolution === '2K' ? '2048x2048' : '4096x4096',
          batch_size: batchSize,
          seed: -1, // Random seed
          env: env
        }
      };

      console.log('Calling Modal ComfyUI API:', {
        url: inferenceApiUrl,
        job_id: jobId,
        user_id,
        face_model_id,
        style_id,
        credits_spent: creditCost,
        resolution,
        batch_size: batchSize
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

        // Note: We don't refund credits here as the generation was attempted
        // Credits are spent when the job starts, not when it completes

        return new Response(
          JSON.stringify({ 
            error: 'Failed to start inference on Modal',
            details: `${modalResponse.status}: ${errorText}`,
            credits_spent: creditCost
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const modalResult = await modalResponse.json();
      console.log('Modal API response:', modalResult);

      // Update job with Modal job ID if provided
      if (modalResult.style_id) {
        await supabase
          .from('inference_jobs')
          .update({
            modal_job_id: modalResult.style_id,
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      }

      return new Response(
        JSON.stringify({
          job_id: jobId,
          modal_job_id: modalResult.style_id,
          status: 'processing',
          estimated_duration: 45,
          credits_spent: creditCost,
          remaining_credits: currentBalance - creditCost,
          resolution,
          batch_size: batchSize,
          message: 'Inference job started successfully on Modal'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (modalError) {
      console.error('Modal API call failed:', modalError);
      
      // Update job status to failed
      await supabase
        .from('inference_jobs')
        .update({
          status: 'failed',
          error_message: `Failed to call Modal API: ${modalError.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      // Note: We don't refund credits here as the generation was attempted

      return new Response(
        JSON.stringify({ 
          error: 'Failed to start inference',
          details: modalError.message,
          credits_spent: creditCost
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