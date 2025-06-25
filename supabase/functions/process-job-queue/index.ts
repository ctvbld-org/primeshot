import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from 'jsr:@supabase/supabase-js@2'

interface JobQueueRequest {
  face_model_id?: string
  action?: 'process_queued' | 'check_all'
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Resolve the base URL for the inference API from an environment variable instead of relying on
    // string replacement so that it works with custom domains and local development setups.
    const inferenceApiBase = Deno.env.get('INFERENCE_API_BASE_URL')
    if (!inferenceApiBase) {
      throw new Error('INFERENCE_API_BASE_URL environment variable not set')
    }
    // Ensure no trailing slash before we append the path.
    const inferenceUrl = `${inferenceApiBase.replace(/\/$/, '')}/api/inference/start`

    // Parse request body
    const { face_model_id, action = 'process_queued' }: JobQueueRequest = 
      req.method === 'POST' ? await req.json() : {}

    console.log(`Processing job queue - Action: ${action}, Face Model ID: ${face_model_id}`)

    let queuedJobs: any[] = []

    if (action === 'process_queued' && face_model_id) {
      // Process jobs for a specific face model that just became ready
      const { data, error } = await supabase
        .from('inference_jobs')
        .select(`
          id,
          user_id,
          face_model_id,
          style_id,
          options,
          created_at
        `)
        .eq('face_model_id', face_model_id)
        .eq('status', 'queued')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching queued jobs:', error)
        throw error
      }

      queuedJobs = data || []

    } else if (action === 'check_all') {
      // Check all queued jobs against ready face models
      const { data, error } = await supabase
        .from('inference_jobs')
        .select(`
          id,
          user_id,
          face_model_id,
          style_id,
          options,
          created_at,
          face_models!inner(status)
        `)
        .eq('status', 'queued')
        .eq('face_models.status', 'completed')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching queued jobs with ready models:', error)
        throw error
      }

      queuedJobs = data || []
    }

    console.log(`Found ${queuedJobs.length} queued jobs to process`)

    const processedJobs = []
    const failedJobs = []

    for (const job of queuedJobs) {
      try {
        console.log(`Processing job ${job.id}`)

        // Update job status to pending
        const { error: updateError } = await supabase
          .from('inference_jobs')
          .update({
            status: 'pending',
            stage: 'initializing',
            progress: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id)

        if (updateError) {
          console.error(`Failed to update job ${job.id}:`, updateError)
          failedJobs.push({ job_id: job.id, error: updateError.message })
          continue
        }

        // Call the inference API endpoint to trigger Modal
        const response = await fetch(inferenceUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            face_model_id: job.face_model_id,
            style_id: job.style_id,
            options: job.options,
            _internal_queue_job_id: job.id // Internal flag to skip queueing
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Failed to start inference for job ${job.id}:`, errorText)
          failedJobs.push({ job_id: job.id, error: errorText })
          
          // Update job status to failed
          await supabase
            .from('inference_jobs')
            .update({
              status: 'failed',
              error_message: `Failed to start inference: ${errorText}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id)
            
          continue
        }

        const result = await response.json()
        console.log(`Successfully started job ${job.id}:`, result)
        processedJobs.push({ job_id: job.id, status: 'started' })

      } catch (jobError) {
        console.error(`Error processing job ${job.id}:`, jobError)
        failedJobs.push({ 
          job_id: job.id, 
          error: jobError instanceof Error ? jobError.message : 'Unknown error' 
        })

        // Update job status to failed
        await supabase
          .from('inference_jobs')
          .update({
            status: 'failed',
            error_message: jobError instanceof Error ? jobError.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed_jobs: processedJobs.length,
        failed_jobs: failedJobs.length,
        details: {
          processed: processedJobs,
          failed: failedJobs
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    console.error('Error in process-job-queue function:', error)
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}) 