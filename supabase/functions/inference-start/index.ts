import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface InferenceRequest {
  user_id: string;
  face_model_id: string;
  style_id: string;
  prompt?: string;
  settings?: {
    strength?: number;
    guidance_scale?: number;
    num_inference_steps?: number;
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

    // Generate job ID
    const jobId = crypto.randomUUID();

    // Create inference job record
    const inferenceJob: Partial<InferenceJob> = {
      id: jobId,
      user_id,
      face_model_id,
      style_id,
      status: 'pending',
      progress: 0,
      estimated_duration: 45, // Default 45 seconds for inference
      prompt: prompt || `A professional photo in ${style.name} style`,
      settings: settings || {
        strength: 0.8,
        guidance_scale: 7.5,
        num_inference_steps: 30
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('inference_jobs')
      .insert(inferenceJob);

    if (insertError) {
      console.error('Failed to create inference job:', insertError);
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

      // Prepare Modal API request
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
          resolution: '1024x1024', // Default resolution
          seed: -1, // Random seed
          env: env
        }
      };

      console.log('Calling Modal ComfyUI API:', {
        url: inferenceApiUrl,
        job_id: jobId,
        user_id,
        face_model_id,
        style_id
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

        return new Response(
          JSON.stringify({ 
            error: 'Failed to start inference on Modal',
            details: `${modalResponse.status}: ${errorText}`
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
          message: 'Inference job started successfully on Modal'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('Modal API call failed:', error);
      
      // Update job status to failed
      await supabase
        .from('inference_jobs')
        .update({
          status: 'failed',
          error_message: `Failed to call Modal API: ${error.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to start inference',
          details: error.message
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