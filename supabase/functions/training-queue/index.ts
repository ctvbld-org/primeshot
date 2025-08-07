import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
}

/**
 * Training Queue Processor
 * 
 * Manages global training concurrency limits (max 2 concurrent training jobs)
 * Processes queued training jobs when slots become available
 */

const MAX_CONCURRENT_TRAINING_JOBS = 2;

async function getRunningTrainingCount(supabase: any): Promise<number> {
  const { count, error } = await supabase
    .from('training_jobs')
    .select('id', { count: 'exact' })
    .eq('status', 'running');

  if (error) {
    console.error('Error getting running training count:', error);
    throw error;
  }

  return count || 0;
}

async function getNextQueuedJob(supabase: any): Promise<TrainingJob | null> {
  const { data, error } = await supabase
    .from('training_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error getting next queued job:', error);
    throw error;
  }

  return data || null;
}

async function startTrainingJob(supabase: any, job: TrainingJob): Promise<boolean> {
  console.log(`Starting training job ${job.id} for character ${job.character_id}`);
  
  try {
    // Get character data
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', job.character_id)
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
    const trainingData = {
      user_id: job.user_id,
      character_id: job.character_id,
      character_name: character.name,
      training_job_id: job.id
    };

    // Call Modal training API
    const modalResponse = await fetch(
      `${Deno.env.get('TRAINING_API_URL')}/train`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Modal-Key': Deno.env.get('MODAL_TOKEN_ID') || '',
          'Modal-Secret': Deno.env.get('MODAL_TOKEN_SECRET') || ''
        },
        body: JSON.stringify(trainingData)
      }
    );

    if (!modalResponse.ok) {
      const errorText = await modalResponse.text();
      console.error(`Modal API error for job ${job.id}:`, errorText);
      
      // Mark job as failed
      await supabase
        .from('training_jobs')
        .update({
          status: 'failed',
          error_message: `Training API error: ${errorText}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);
      
      return false;
    }

    const result = await modalResponse.json();
    
    // Update job status to running
    const { error: updateError } = await supabase
      .from('training_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        modal_job_id: result.job_handle || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    if (updateError) {
      console.error(`Error updating job ${job.id} to running:`, updateError);
      return false;
    }

    // Update character status to training
    await supabase
      .from('characters')
      .update({
        status: 'training',
        updated_at: new Date().toISOString()
      })
      .eq('id', job.character_id);

    console.log(`✅ Successfully started training job ${job.id}`);
    return true;

  } catch (error) {
    console.error(`Error starting training job ${job.id}:`, error);
    
    // Mark job as failed
    await supabase
      .from('training_jobs')
      .update({
        status: 'failed',
        error_message: `Queue processing error: ${error.message}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);
    
    return false;
  }
}

async function processTrainingQueue(supabase: any): Promise<{ processed: number; available_slots: number }> {
  console.log('🔄 Processing training queue...');
  
  const runningCount = await getRunningTrainingCount(supabase);
  const availableSlots = MAX_CONCURRENT_TRAINING_JOBS - runningCount;
  
  console.log(`Current running jobs: ${runningCount}/${MAX_CONCURRENT_TRAINING_JOBS}`);
  console.log(`Available slots: ${availableSlots}`);
  
  if (availableSlots <= 0) {
    console.log('No available training slots, queue processing skipped');
    return { processed: 0, available_slots: 0 };
  }

  let processed = 0;
  
  // Process available slots
  for (let i = 0; i < availableSlots; i++) {
    const nextJob = await getNextQueuedJob(supabase);
    
    if (!nextJob) {
      console.log('No more queued jobs to process');
      break;
    }
    
    console.log(`Processing queued job ${nextJob.id} (${i + 1}/${availableSlots})`);
    
    const success = await startTrainingJob(supabase, nextJob);
    if (success) {
      processed++;
    }
    
    // Small delay between job starts to avoid race conditions
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`✅ Training queue processing complete: ${processed} jobs started`);
  return { processed, available_slots: availableSlots - processed };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
        available_slots: result.available_slots,
        max_concurrent_jobs: MAX_CONCURRENT_TRAINING_JOBS,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
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
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})