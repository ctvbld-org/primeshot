import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify request method
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get job ID from URL parameters
    const url = new URL(req.url);
    const jobId = url.searchParams.get('job_id');
    const userId = url.searchParams.get('user_id');

    if (!jobId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing job_id or user_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get inference job with user verification
    const { data: job, error: jobError } = await supabase
      .from('inference_jobs')
      .select(`
        id,
        user_id,
        face_model_id,
        style_id,
        status,
        progress,
        modal_job_id,
        estimated_duration,
        created_at,
        updated_at,
        error_message,
        result_url,
        prompt,
        settings,
        face_models (
          id,
          name,
          status
        ),
        styles (
          id,
          name,
          description,
          thumbnail_url
        )
      `)
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Inference job not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate additional metrics
    const now = new Date();
    const createdAt = new Date(job.created_at);
    const elapsedTime = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
    
    let estimatedRemaining = 0;
    if (job.status === 'processing' && job.progress > 0 && job.estimated_duration) {
      const progressRatio = job.progress / 100;
      const estimatedTotal = elapsedTime / progressRatio;
      estimatedRemaining = Math.max(0, Math.floor(estimatedTotal - elapsedTime));
    }

    // Special handling for queued jobs - check if face model is ready
    let queuePosition = 0;
    if (job.status === 'queued') {
      // Count how many jobs are ahead in the queue for this face model
      const { count } = await supabase
        .from('inference_jobs')
        .select('*', { count: 'exact' })
        .eq('face_model_id', job.face_model_id)
        .eq('status', 'queued')
        .lt('created_at', job.created_at);
      
      queuePosition = count || 0;

      // Check if face model is now ready and start the job
      const { data: faceModel } = await supabase
        .from('face_models')
        .select('status')
        .eq('id', job.face_model_id)
        .single();

      if (faceModel?.status === 'ready' && queuePosition === 0) {
        // Update job to pending and start processing
        await supabase
          .from('inference_jobs')
          .update({
            status: 'pending',
            modal_job_id: `modal_inf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            estimated_duration: 45,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);

        console.log(`[MOCK] Starting queued inference job ${jobId} - face model is now ready`);
      }
    }

    // Format response
    const response = {
      job_id: job.id,
      face_model_id: job.face_model_id,
      style_id: job.style_id,
      face_model: job.face_models,
      style: job.styles,
      status: job.status,
      progress: job.progress,
      modal_job_id: job.modal_job_id,
      estimated_duration: job.estimated_duration,
      elapsed_time: elapsedTime,
      estimated_remaining: estimatedRemaining,
      queue_position: queuePosition,
      created_at: job.created_at,
      updated_at: job.updated_at,
      error_message: job.error_message,
      result_url: job.result_url,
      prompt: job.prompt,
      settings: job.settings,
      is_complete: job.status === 'completed' || job.status === 'failed'
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Inference progress error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 