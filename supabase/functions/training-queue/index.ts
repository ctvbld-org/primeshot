import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

interface TrainingJob {
  id: string;
  character_id: string;
  user_id: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  modal_job_id?: string;
  error_message?: string;
  retry_count?: number;
  retry_after?: string | null;
}

/**
 * Training Queue Processor
 *
 * Submits queued training jobs to the provider. No app-wide concurrency limits
 * are enforced here; provider-side (Modal) handles global queuing. Jobs are
 * queued here only for transient failures/backoff (retry_after) and are retried
 * when eligible.
 */

// No app-wide running count needed; per-user concurrency is handled in training-start

async function getNextQueuedJob(supabase: any): Promise<TrainingJob | null> {
  const { data, error } = await supabase.rpc('claim_next_queued_training_job');
  if (error) {
    console.error('Error claiming next queued job:', error);
    throw error;
  }
  const job = data as TrainingJob | null;
  if (!job || !job.id) {
    return null;
  }
  return job;
}

async function startTrainingJob(supabase: any, job: TrainingJob): Promise<boolean> {
  console.log(`Starting training job ${job.id} for character ${job.character_id}`);
  
  try {
    // Capacity was enforced by the claim RPC (Option B). No additional checks here.

    // Get character data with ownership validation
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('id, name, user_id')
      .eq('id', job.character_id)
      .eq('user_id', job.user_id)
      .single();

    if (characterError || !character) {
      console.error(`Character not found for job ${job.id}:`, characterError);
      
      // Mark job as failed
      await supabase
        .from('training_jobs')
        .update({
          status: 'failed',
          error_message: 'Character not found',
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);
      
      return false;
    }

    // Prepare training request data
    // Fetch persisted admin overrides if present
    const { data: jobRow } = await supabase
      .from('training_jobs')
      .select('training_params')
      .eq('id', job.id)
      .single();

    // Safely parse training_params whether it’s already an object or a JSON string
    let overrides = jobRow?.training_params as unknown;
    if (typeof overrides === 'string') {
      try {
        overrides = JSON.parse(overrides);
      } catch {
        overrides = {};
      }
    }

    const trainingData = {
      user_id: job.user_id,
      character_id: job.character_id,
      character_name: character.name,
      training_job_id: job.id,
      // Only spread if overrides is a plain object
      ...(overrides && typeof overrides === 'object' ? overrides : {})
    };
    // Validate provider configuration
    const trainingApiUrl = Deno.env.get('TRAINING_API_URL') || ''
    const modalKey = Deno.env.get('MODAL_TOKEN_ID') || ''
    const modalSecret = Deno.env.get('MODAL_TOKEN_SECRET') || ''
    if (!trainingApiUrl || !modalKey || !modalSecret) {
      await supabase
        .from('training_jobs')
        .update({
          status: 'failed',
          error_message:
            'Provider configuration missing (TRAINING_API_URL/MODAL_TOKEN_ID/MODAL_TOKEN_SECRET)',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)
      return false
    }

    // Call Modal training API with timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort('timeout'), 30000)
    let modalResponse: Response
    try {
      modalResponse = await fetch(trainingApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Modal-Key': modalKey,
          'Modal-Secret': modalSecret,
        },
        body: JSON.stringify(trainingData),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout);
    }

    if (!modalResponse.ok) {
      const errorText = await modalResponse.text();
      console.error(`Modal API error for job ${job.id}:`, errorText);
      const status = modalResponse.status;
      const isTransient = status === 429 || status >= 500;

      if (isTransient) {
        // Transient failure: requeue with exponential backoff
        const retryCount = (job.retry_count ?? 0) + 1;
        const backoffMinutes = Math.min(30, Math.max(2, Math.pow(2, retryCount)));
        const retryAfter = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

        await supabase
          .from('training_jobs')
          .update({
            status: 'queued',
            error_message: `Training API transient error (${status}): ${errorText}`,
            retry_count: retryCount,
            retry_after: retryAfter,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);
      } else {
        // Permanent failure
        await supabase
          .from('training_jobs')
          .update({
            status: 'failed',
            error_message: `Training API error (${status}): ${errorText}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);
      }

      return false;
    }

    const result = await modalResponse.json();
    
    // Update job status to pending (provider queue) and store modal_job_id
    const { error: updateError } = await supabase
      .from('training_jobs')
      .update({
        status: 'pending',
        modal_job_id: result.job_handle || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    if (updateError) {
      console.error(`Error updating job ${job.id} to pending:`, updateError);
      return false;
    }

    console.log(`✅ Submitted training job ${job.id} to provider (pending)`);
    return true;

  } catch (error) {
    console.error(`Error starting training job ${job.id}:`, error);
    
    // Transient failure: requeue with backoff
    const retryCount = (job.retry_count ?? 0) + 1;
    const backoffMinutes = Math.min(30, Math.max(2, Math.pow(2, retryCount)));
    const retryAfter = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

    await supabase
      .from('training_jobs')
      .update({
        status: 'queued',
        error_message: `Queue processing error: ${ (error as Error).message }`,
        retry_count: retryCount,
        retry_after: retryAfter,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);
    
    return false;
  }
}

async function processTrainingQueue(supabase: any): Promise<{ processed: number }> {
  console.log('🔄 Processing training queue...');

  let processed = 0;

  // Process up to a small batch of queued jobs per invocation
  for (let i = 0; i < 10; i++) {
    const nextJob = await getNextQueuedJob(supabase);

    if (!nextJob) {
      // No claim this iteration; continue to next attempt to reduce latency
      await new Promise(resolve => setTimeout(resolve, 200));
      continue;
    }

    console.log(`Processing queued job ${nextJob.id} (${i + 1}/10)`);

    const success = await startTrainingJob(supabase, nextJob);
    if (success) {
      processed++;
    }

    // Small delay between job starts to avoid race conditions
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`✅ Training queue processing complete: ${processed} jobs started`);
  return { processed };
}

serve(async (req) => {
  // Get dynamic CORS headers based on request origin
  const dynamicCorsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: dynamicCorsHeaders })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Process the training queue
    const result = await processTrainingQueue(supabase);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Training queue processed',
        jobs_started: result.processed,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...dynamicCorsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Training queue processing error:', error)
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...dynamicCorsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})