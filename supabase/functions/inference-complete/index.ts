import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ArtifactEntry { bucket: string; key: string; width?: number; height?: number; bytes?: number; format?: string }
interface InferenceCompleteRequest {
  job_id: string
  success?: boolean
  error_message?: string
  artifacts?: { web?: ArtifactEntry[]; orig?: ArtifactEntry[] }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { job_id, success, error_message, artifacts }: InferenceCompleteRequest = await req.json()
    if (!job_id) {
      return new Response(JSON.stringify({ error: 'Missing job_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: job } = await supabase
      .from('inference_jobs')
      .select('id, user_id, status')
      .eq('id', job_id)
      .single()

    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return new Response(JSON.stringify({ ok: true, message: 'Already settled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // If artifacts provided, upsert generated_images first
    if (artifacts && (artifacts.web?.length || artifacts.orig?.length)) {
      const web = artifacts.web || []
      const orig = artifacts.orig || []
      const rows: any[] = []
      const count = Math.max(web.length, orig.length)
      for (let i = 0; i < count; i++) {
        const w = web[i]
        const o = orig[i]
        rows.push({
          user_id: job.user_id,
          inference_id: job_id,
          web_path: w ? `s3://${w.bucket}/${w.key}` : null,
          original_path: o ? `s3://${o.bucket}/${o.key}` : null,
          width: (w?.width ?? o?.width) || null,
          height: (w?.height ?? o?.height) || null,
          format: (w?.format ?? o?.format) || null,
          bytes: (w?.bytes ?? o?.bytes) || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
      if (rows.length > 0) {
        const { error: upsertErr } = await supabase
          .from('generated_images')
          // onConflict depends on your schema; if you have a unique constraint adjust accordingly
          .upsert(rows)
        if (upsertErr) {
          console.error('generated_images upsert failed:', upsertErr)
        }
      }
    }

    await supabase
      .from('inference_jobs')
      .update({
        status: success ?? (artifacts && ((artifacts.web?.length || 0) > 0 || (artifacts.orig?.length || 0) > 0)) ? 'completed' : 'failed',
        error_message: success ? null : (error_message ?? 'Unknown error'),
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', job_id)

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

    return new Response(JSON.stringify({ success: true, job_id, status: success ? 'completed' : 'failed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Inference completion error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})


