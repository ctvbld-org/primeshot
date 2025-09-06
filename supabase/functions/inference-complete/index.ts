import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

interface InferenceCompleteRequest {
  job_id: string
  success?: boolean
  error_message?: string
}

serve(async (req) => {
  // Get dynamic CORS headers based on request origin
  const dynamicCorsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: dynamicCorsHeaders })
  }

  // Enforce POST and authenticate
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: dynamicCorsHeaders })
  }
  const auth = req.headers.get('authorization') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (!serviceRoleKey || auth !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { job_id, success = true, error_message }: InferenceCompleteRequest = await req.json()

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'Missing job_id' }), 
        { 
          status: 400, 
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🎯 Completing inference job ${job_id} with success: ${success}`)

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Update inference job status
    const updateData: any = {
      status: success ? 'completed' : 'failed',
      completed_at: new Date().toISOString()
    }

    if (error_message) {
      updateData.error_message = error_message
    }

    const { error: updateError } = await supabase
      .from('inference_jobs')
      .update(updateData)
      .eq('id', job_id)

    if (updateError) {
      console.error(`❌ Failed to update job ${job_id}:`, updateError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update job status', 
          details: updateError.message 
        }), 
        { 
          status: 500, 
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Successfully completed job ${job_id}`)

    // Trigger queue processing to start next queued jobs for relevant users
    try {
      const queueResp = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/inference-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ trigger: 'inference_completed', completed_job_id: job_id }),
      })
      if (!queueResp.ok) {
        console.error('Failed to trigger inference-queue:', await queueResp.text())
      }
    } catch (err) {
      console.error('Non-blocking: inference queue trigger failed', err)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        job_id, 
        status: success ? 'completed' : 'failed' 
      }), 
      {
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Inference completion error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      {
        status: 500,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})