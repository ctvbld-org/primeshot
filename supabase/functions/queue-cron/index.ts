import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function shouldTrigger(supabase: any, type: 'training' | 'inference'): Promise<boolean> {
  const fn = type === 'training' ? 'should_trigger_training_queue' : 'should_trigger_inference_queue'
  const { data, error } = await supabase.rpc(fn)
  if (error) {
    console.error(`Error calling ${fn}:`, error)
    return false
  }
  return Boolean(data)
}

async function triggerQueue(type: 'training' | 'inference') {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${type}-queue`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ trigger: 'cron' }),
  })
  if (!res.ok) {
    console.error(`${type}-queue call failed`, res.status, await res.text())
  }
}

async function triggerCleanup() {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/inference-cleanup`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ trigger: 'cron' }),
  })
  if (!res.ok) {
    console.error(`inference-cleanup call failed`, res.status, await res.text())
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const intervalMs = Number(Deno.env.get('QUEUE_CRON_INTERVAL_MS') || 300000) // 5m default
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const startedAt = new Date().toISOString()
    let trainingTriggered = false
    let inferenceTriggered = false
    let cleanupTriggered = false

    if (await shouldTrigger(supabase, 'training')) {
      await triggerQueue('training')
      trainingTriggered = true
    }
    if (await shouldTrigger(supabase, 'inference')) {
      await triggerQueue('inference')
      inferenceTriggered = true
    }
    
    // Always run cleanup check (it's fast and only acts if needed)
    await triggerCleanup()
    cleanupTriggered = true

    // Optionally run as a one-shot timer if called with ?loop=1
    const url = new URL(req.url)
    if (url.searchParams.get('loop') === '1') {
      // Run a simple timer loop
      for (;;) {
        await new Promise((r) => setTimeout(r, intervalMs))
        if (await shouldTrigger(supabase, 'training')) await triggerQueue('training')
        if (await shouldTrigger(supabase, 'inference')) await triggerQueue('inference')
        await triggerCleanup() // Run cleanup every cycle
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        startedAt,
        trainingTriggered,
        inferenceTriggered,
        cleanupTriggered,
        intervalMs,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


