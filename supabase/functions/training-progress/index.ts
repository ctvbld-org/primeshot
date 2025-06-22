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

    // Get training job with user verification
    const { data: job, error: jobError } = await supabase
      .from('training_jobs')
      .select(`
        id,
        user_id,
        face_model_id,
        status,
        progress,
        modal_job_id,
        estimated_duration,
        created_at,
        updated_at,
        error_message,
        face_models (
          id,
          name,
          status,
          image_count
        ),
        started_at,
        completed_at
      `)
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Training job not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate additional metrics
    const now = new Date();
    const createdAt = new Date(job.created_at);
    const startedAt = job.started_at ? new Date(job.started_at) : createdAt;
    
    // Calculate elapsed time from actual training start, not job creation
    const elapsedTime = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    
    let estimatedRemaining = 0;
    let queuePosition = 0;
    
    // Improved estimation logic for running jobs with progress
    if (job.status === 'running' && job.progress > 0) {
      // Use estimated_duration from AI container if available (more accurate)
      if (job.estimated_duration) {
        const progressRatio = job.progress / 100;
        const estimatedTotal = job.estimated_duration;
        // Calculate remaining time based on progress ratio, not elapsed time
        estimatedRemaining = Math.max(0, Math.floor(estimatedTotal * (1 - progressRatio)));
      } else {
        // Fallback: estimate based on current progress rate
        const progressRatio = job.progress / 100;
        if (progressRatio > 0.05) { // Only estimate after 5% progress to avoid wild estimates
          // Estimate total time based on progress rate, with phase-based adjustments
          let estimatedTotal;
          
          if (job.progress < 10) {
            // Setup phase: slower progress per unit time
            estimatedTotal = elapsedTime / progressRatio * 1.2; // 20% buffer for setup phase
          } else if (job.progress < 94) {
            // Training phase: more predictable progress
            estimatedTotal = elapsedTime / progressRatio;
          } else {
            // Completion phase: faster remaining progress
            estimatedTotal = elapsedTime / progressRatio * 0.9; // Completion is usually faster
          }
          
          estimatedRemaining = Math.max(0, Math.floor(estimatedTotal - elapsedTime));
        }
      }
    }
    
    // For queued jobs, calculate queue position and estimated wait time
    if (job.status === 'queued') {
      // Get queue position by counting earlier queued jobs
      const { data: queueData, error: queueError } = await supabase
        .from('training_jobs')
        .select('id')
        .eq('status', 'queued')
        .lt('created_at', job.created_at)
        .order('created_at', { ascending: true });
      
      if (!queueError && queueData) {
        queuePosition = queueData.length + 1; // Position in queue (1-based)
        
        // Get average training time from recent completed jobs for wait estimate
        const { data: recentJobs, error: recentError } = await supabase
          .from('training_jobs')
          .select('estimated_duration, started_at, completed_at')
          .eq('status', 'completed')
          .not('started_at', 'is', null)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(10);
        
        if (!recentError && recentJobs && recentJobs.length > 0) {
          // Calculate average training time from recent completions
          const avgTrainingTime = recentJobs.reduce((sum, recentJob) => {
            const startTime = new Date(recentJob.started_at).getTime();
            const endTime = new Date(recentJob.completed_at).getTime();
            return sum + (endTime - startTime) / 1000;
          }, 0) / recentJobs.length;
          
          // Estimate wait time: (position - 1) * average training time
          // Assuming one job at a time
          estimatedRemaining = Math.floor((queuePosition - 1) * avgTrainingTime);
        } else {
          // Fallback to default estimate (25 minutes per job)
          estimatedRemaining = 1500 * (queuePosition - 1);
        }
      }
    }

    // Enhanced response with queue information and historical context
    const response = {
      job_id: jobId,
      face_model_id: job.face_model_id,
      face_model: job.face_models ? {
        id: job.face_models.id,
        name: job.face_models.name,
        status: job.face_models.status
      } : undefined,
      status: job.status,
      progress: Math.round(job.progress || 0),
      modal_job_id: job.modal_job_id,
      estimated_duration: job.estimated_duration,
      elapsed_time: elapsedTime,
      estimated_remaining: estimatedRemaining,
      queue_position: queuePosition,
      created_at: job.created_at,
      updated_at: job.updated_at,
      started_at: job.started_at,
      completed_at: job.completed_at,
      error_message: job.error_message,
      message: job.message, // Progress message from the tracker
      image_count: job.face_models?.image_count || 0,
      is_complete: job.status === 'completed'
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Training progress error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 