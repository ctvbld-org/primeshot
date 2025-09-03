import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildFinalPrompt, buildGlassesPrompt, buildPronoun, buildSubjectPrompt, safeJoin } from '../_shared/prompt.ts'

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
  // Persisted columns written by inference-create
  quality?: string | null
  nb_takes?: number | null
  aspect_ratio?: string | null
  prompt_override?: { enabled: boolean; prompt: string } | null
  wardrobe_id?: string | null
  color_id?: string | null
  scene_id?: string | null
}

// Capacity is enforced in the claim RPC (Option B). No local checks needed here.

async function claimNextQueuedInferenceJob(supabase: any): Promise<InferenceJobRow | null> {
  const { data, error } = await supabase.rpc('claim_next_queued_inference_job')
  if (error) {
    console.error('Error claiming queued inference job:', error)
    return null
  }
  return (data as InferenceJobRow) || null
}

async function startInferenceJob(supabase: any, job: InferenceJobRow): Promise<boolean> {
  async function refundIfAny(reason: string) {
    try {
      const { data: row } = await supabase
        .from('inference_jobs')
        .select('credits_spent, user_id')
        .eq('id', job.id)
        .single()
      const amount = (row?.credits_spent as number) || 0
      const userId = (row?.user_id as string) || job.user_id
      if (amount > 0 && userId) {
        const key = `inference_failure_refund_${job.id}`
        await supabase.rpc('refund_credits_with_idempotency', {
          p_user_id: userId,
          p_job_id: job.id,
          p_amount: amount,
          p_reason: reason,
          p_idempotency_key: key,
        })
      }
    } catch (e) {
      console.error('Refund attempt failed (non-blocking):', e)
    }
  }
  try {
    // Fetch character and style
    const [{ data: character }, { data: style }] = await Promise.all([
      supabase.from('characters').select('id, status, lora_path, metadata').eq('id', job.character_id).single(),
      supabase.from('styles').select('id, prompt, lora_path').eq('id', job.style_id).single(),
    ])

    if (!character || !style) {
      await supabase
        .from('inference_jobs')
        .update({ status: 'failed', error_message: 'Character or style not found', updated_at: new Date().toISOString() })
        .eq('id', job.id)
      await refundIfAny('Refund for failed inference: character or style not found')
      return false
    }

    // Force fast queue regardless of stored value
    const queueType: 'fast' = 'fast'
    const inferenceApiUrl = Deno.env.get('INFERENCE_API_URL')
    if (!inferenceApiUrl) {
      throw new Error('INFERENCE_API_URL environment variable not set')
    }

    // ----- Pre-flight checks -----
    // Character readiness
    // If character still training, requeue with a short delay (race-safe)
    if (character?.status === 'training') {
      await supabase
        .from('inference_jobs')
        .update({ status: 'queued', retry_after: new Date(Date.now() + 60 * 1000).toISOString(), error_message: 'Character not ready yet', updated_at: new Date().toISOString() })
        .eq('id', job.id)
      return false
    }

    // If LoRA is missing, fail and refund
    if (!character?.lora_path) {
      await supabase
        .from('inference_jobs')
        .update({ status: 'failed', error_message: 'Character missing lora_path', updated_at: new Date().toISOString() })
        .eq('id', job.id)
      await refundIfAny('Refund: missing character lora_path')
      return false
    }

    // Other failure states (e.g., explicit training failure)
    if (character?.status === 'failed') {
      await supabase
        .from('inference_jobs')
        .update({ status: 'failed', error_message: 'Character training failed', updated_at: new Date().toISOString() })
        .eq('id', job.id)
      await refundIfAny('Refund: character training failed before inference could run')
      return false
    }

    // ----- Build prepared payload (mirror inference-create) -----
    const styleLora = (style as any)?.lora_path || ''
    const characterLora = character.lora_path as string

    let wardrobePrompt = ''
    if (job.wardrobe_id) {
      const { data: w } = await supabase.from('style_wardrobes').select('*').eq('id', job.wardrobe_id).maybeSingle()
      wardrobePrompt = (w?.prompt || w?.name || w?.title || '').toString()
    }
    let colorValue = ''
    if (job.color_id) {
      const { data: c } = await supabase.from('style_colors').select('*').eq('id', job.color_id).maybeSingle()
      colorValue = (c?.value || c?.name || c?.label || '').toString()
    }
    let scenePrompt = ''
    if (job.scene_id) {
      const { data: s } = await supabase.from('style_scenes').select('*').eq('id', job.scene_id).maybeSingle()
      scenePrompt = (s?.prompt || s?.name || s?.title || '').toString()
    }
    const stylePrompt = (style as any)?.prompt || ''
    const negativePrompt = ''

    const { subject: subjectPrompt, pronoun } = buildSubjectPrompt(character?.metadata || {})
    // glasses merged into subject in shared builder
    const wearLine = wardrobePrompt || colorValue ? `${pronoun} is wearing ${colorValue ? `a ${colorValue} ` : ''}${wardrobePrompt}` : ''
    const wardrobeClean = wearLine ? (wearLine.endsWith('.') ? wearLine : `${wearLine}.`) : ''
    const finalPrompt = job?.prompt_override?.enabled && job?.prompt_override?.prompt
      ? String(job.prompt_override.prompt)
      : buildFinalPrompt({ style: stylePrompt, subject: subjectPrompt, wardrobe: wardrobeClean, scene: scenePrompt })

    const resolveWorkflow = (s: any, params: any): string => {
      const key = s?.workflow || s?.workflow_key || s?.workflow_s3_key
      if (typeof key === 'string' && key.length > 0) return key
      return 'workflows/WAN2.1.json'
    }
    const workflowKey = resolveWorkflow(style, job?.settings || {})

    // Resolve generation parameters. Prefer top-level columns persisted by inference-create,
    // fall back to legacy settings JSON if present, and finally safe defaults.
    const resolvedNbTakes = (job as any)?.nb_takes ?? job?.settings?.nb_takes ?? 5
    const resolvedQuality = (job as any)?.quality ?? job?.settings?.quality ?? '1K'
    const resolvedAspect = (job as any)?.aspect_ratio ?? job?.settings?.aspect_ratio ?? '1:1'

    const modalRequest = {
      user_id: job.user_id,
      job_id: job.id,
      character_id: job.character_id,
      style_id: job.style_id,
      wardrobe_id: job.wardrobe_id,
      color_id: job.color_id,
      scene_id: job.scene_id,
      params: {
        nb_takes: resolvedNbTakes,
        quality: resolvedQuality,
        aspect_ratio: resolvedAspect,
        seed: job?.settings?.seed ?? -1,
      },
      prepared: {
        workflow: workflowKey,
        prompt: finalPrompt,
        negative_prompt: negativePrompt,
        character_lora: characterLora,
        style_lora: styleLora || '',
      }
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const tokenId = Deno.env.get('MODAL_TOKEN_ID')
    const tokenSecret = Deno.env.get('MODAL_TOKEN_SECRET')
    if (tokenId && tokenSecret) {
      headers['Modal-Key'] = tokenId
      headers['Modal-Secret'] = tokenSecret
    }

    // Timeout + abort to avoid hangs
    const controller = new AbortController()
    const timeoutMs = Number(Deno.env.get('INFERENCE_HTTP_TIMEOUT_MS') ?? 30000)
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs)
    let modalResponse: Response
    try {
      modalResponse = await fetch(inferenceApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(modalRequest),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutHandle)
    }

    if (!modalResponse.ok) {
      // Treat provider rate limiting and server errors as transient → requeue (no refund)
      if (modalResponse.status === 429 || modalResponse.status >= 500) {
        const backoffMs = Number(Deno.env.get('INFERENCE_RETRY_BACKOFF_MS') ?? 90000)
        await supabase
          .from('inference_jobs')
          .update({
            status: 'queued',
            retry_after: new Date(Date.now() + backoffMs).toISOString(),
            error_message: `Provider ${modalResponse.status}; will retry`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id)
        return false
      }
      const errorText = (await modalResponse.text()).slice(0, 512)
      await supabase
        .from('inference_jobs')
        .update({ status: 'failed', error_message: `Modal API error: ${errorText}`, updated_at: new Date().toISOString() })
        .eq('id', job.id)
      await refundIfAny('Refund: provider submission failed')
      return false
    }

    const modalResult = await modalResponse.json()

    await supabase
      .from('inference_jobs')
      .update({
        status: 'pending',
        modal_job_id: modalResult.job_id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return true
  } catch (error) {
    console.error(`Error starting inference job ${job.id}:`, error)
    // Abort (timeout) → requeue (no refund)
    if ((error as any)?.name === 'AbortError') {
      const backoffMs = Number(Deno.env.get('INFERENCE_RETRY_BACKOFF_MS') ?? 90000)
      await supabase
        .from('inference_jobs')
        .update({
          status: 'queued',
          retry_after: new Date(Date.now() + backoffMs).toISOString(),
          error_message: 'Provider timeout; will retry',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)
      return false
    }
    await supabase
      .from('inference_jobs')
      .update({ status: 'failed', error_message: `Queue error: ${(error as Error)?.message ?? String(error)}`, updated_at: new Date().toISOString() })
      .eq('id', job.id)
    await refundIfAny('Refund: queue error before inference could start')
    return false
  }
}

async function processInferenceQueue(supabase: any): Promise<{ processed: number; checked: number }> {
  let processed = 0
  let checked = 0
  for (let i = 0; i < 10; i++) {
    const job = await claimNextQueuedInferenceJob(supabase)
    if (!job) {
      await new Promise((r) => setTimeout(r, 200))
      continue
    }
    checked++
    const ok = await startInferenceJob(supabase, job)
    if (ok) processed++
    await new Promise((r) => setTimeout(r, 500))
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


