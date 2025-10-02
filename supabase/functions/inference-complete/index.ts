import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

// AI Job Monitoring
async function reportInferenceFailure(
  jobId: string,
  userId: string,
  characterId: string,
  errorMessage: string,
  creditsSpent?: number
): Promise<void> {
  // Use AI_MONITORING_SLACK_WEBHOOK if available, otherwise fall back to SECURITY_SLACK_WEBHOOK
  const webhookUrl = Deno.env.get('AI_MONITORING_SLACK_WEBHOOK') || Deno.env.get('SECURITY_SLACK_WEBHOOK');
  if (!webhookUrl) return;

  const payload = {
    channel: '#ai-gen-monitoring',
    username: 'AI Job Monitor',
    icon_emoji: ':robot_face:',
    attachments: [{
      color: 'warning',
      title: '🔴 Inference Job Failed',
      text: `Inference job failed: ${errorMessage}`,
      fields: [
        {
          title: 'Job Type',
          value: '🎨 Inference',
          short: true
        },
        {
          title: 'Job ID',
          value: jobId.substring(0, 8) + '...',
          short: true
        },
        {
          title: 'User ID',
          value: userId.substring(0, 8) + '...',
          short: true
        },
        {
          title: 'Character ID',
          value: characterId.substring(0, 8) + '...',
          short: true
        },
        {
          title: 'Error Message',
          value: errorMessage.substring(0, 200) + (errorMessage.length > 200 ? '...' : ''),
          short: false
        },
        ...(creditsSpent ? [{
          title: 'Credits Spent',
          value: creditsSpent.toString(),
          short: true
        }] : []),
        {
          title: 'Timestamp',
          value: new Date().toLocaleString(),
          short: true
        }
      ],
      footer: 'PrimeShot AI Job Monitor',
      ts: Math.floor(Date.now() / 1000)
    }]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`Inference failure Slack alert failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending inference failure Slack alert:', error);
  }
}

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

    // Get job details for monitoring before updating
    let jobDetails = null;
    if (!success) {
      const { data: job } = await supabase
        .from('inference_jobs')
        .select('user_id, character_id, credits_spent')
        .eq('id', job_id)
        .single();
      jobDetails = job;
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

    // Report inference failure to monitoring system
    if (!success && jobDetails) {
      await reportInferenceFailure(
        job_id,
        jobDetails.user_id,
        jobDetails.character_id,
        error_message || 'Inference failed',
        jobDetails.credits_spent
      );
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