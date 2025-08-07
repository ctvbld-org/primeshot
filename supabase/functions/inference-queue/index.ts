import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InferenceJobRow {
  id: string
  user_id: string
  character_id: string
  style_id: string
  status: string
  created_at: string
  updated_at?: string
  error_message?: string
  modal_job_id?: string | null
  // Optional JSON field if present in DB
  settings?: any
}

async function getUserConcurrentLimit(supabase: any, userId: string): Promise<number> {
  // Default for non-subscribed users
  let concurrent = 1

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('plan_name')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (subscription?.plan_name) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('concurrent_jobs')
        .eq('name', subscription.plan_name)
        .single()
      if (!error && data?.concurrent_jobs) {
        concurrent = data.concurrent_jobs
      }
    } catch (_) {
      // keep default
    }
  }

  return concurrent
}

async function getUserRunningCount(supabase: any, userId: string): Promise<number> {
  const { count } = await supabase
    .from('inference_jobs')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])
  return count || 0
}

async function getQueuedJobsBatch(supabase: any, limit = 10): Promise<InferenceJobRow[]> {
  const { data, error } = await supabase
    .from('inference_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching queued inference jobs:', error)
    return []
  }

  return data || []
}

async function startInferenceJob(supabase: any, job: InferenceJobRow): Promise<boolean> {
  try {
    // Fetch character and style
    const [{ data: character }, { data: style }] = await Promise.all([
      supabase.from('characters').select('id, lora_path').eq('id', job.character_id).single(),
      supabase.from('styles').select('*').eq('id', job.style_id).single(),
    ])

    if (!character || !style) {
      await supabase
        .from('inference_jobs')
        .update({ status: 'failed', error_message: 'Character or style not found', updated_at: new Date().toISOString() })
        .eq('id', job.id)
      return false
    }

    const queueType: 'fast' | 'slow' = job?.settings?.queue_type === 'slow' ? 'slow' : 'fast'
    const slowUrl = Deno.env.get('INFERENCE_SLOW_API_URL')
    const defaultUrl = Deno.env.get('INFERENCE_API_URL')
    const inferenceApiUrl = queueType === 'slow' ? (slowUrl || defaultUrl) : defaultUrl
    if (!inferenceApiUrl) {
      throw new Error('INFERENCE_API_URL environment variable not set')
    }

    const modalRequest = {
      user_id: job.user_id,
      workflow_name: style.workflow_name || 'flux_lora',
      parameters: {
        prompt: 'A professional photo',
        lora_path: character.lora_path,
        style_lora_path: style.lora_path,
        strength: job?.settings?.strength ?? 0.8,
        guidance_scale: job?.settings?.guidance_scale ?? 7.5,
        num_inference_steps: job?.settings?.num_inference_steps ?? 30,
        resolution: job?.settings?.resolution === '2K' ? '2048x2048' : job?.settings?.resolution === '4K' ? '4096x4096' : '1024x1024',
        batch_size: job?.settings?.batch_size ?? 5,
        seed: -1,
      },
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const tokenId = Deno.env.get('MODAL_TOKEN_ID')
    const tokenSecret = Deno.env.get('MODAL_TOKEN_SECRET')
    if (tokenId && tokenSecret) {
      headers['Modal-Key'] = tokenId
      headers['Modal-Secret'] = tokenSecret
    }

    const modalResponse = await fetch(inferenceApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(modalRequest),
    })

    if (!modalResponse.ok) {
      const errorText = await modalResponse.text()
      await supabase
        .from('inference_jobs')
        .update({ status: 'failed', error_message: `Modal API error: ${errorText}`, updated_at: new Date().toISOString() })
        .eq('id', job.id)
      return false
    }

    const modalResult = await modalResponse.json()

    await supabase
      .from('inference_jobs')
      .update({
        status: 'processing',
        modal_job_id: modalResult.style_id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return true
  } catch (error) {
    console.error(`Error starting inference job ${job.id}:`, error)
    await supabase
      .from('inference_jobs')
      .update({ status: 'failed', error_message: `Queue error: ${error.message}`, updated_at: new Date().toISOString() })
      .eq('id', job.id)
    return false
  }
}

async function processInferenceQueue(supabase: any): Promise<{ processed: number; checked: number }> {
  const queuedJobs = await getQueuedJobsBatch(supabase, 20)
  if (!queuedJobs.length) return { processed: 0, checked: 0 }

  let processed = 0
  let checked = 0
  for (const job of queuedJobs) {
    checked++
    const limit = await getUserConcurrentLimit(supabase, job.user_id)
    const running = await getUserRunningCount(supabase, job.user_id)
    if (running >= limit) {
      continue
    }
    const ok = await startInferenceJob(supabase, job)
    if (ok) processed++
    // tiny delay to reduce race conditions
    await new Promise((r) => setTimeout(r, 300))
  }
  return { processed, checked }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const result = await processInferenceQueue(supabase)

    return new Response(
      JSON.stringify({ success: true, ...result, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Inference queue error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


