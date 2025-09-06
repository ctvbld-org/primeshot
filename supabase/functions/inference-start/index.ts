import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface InferenceStartedRequest {
  job_id: string;
}

serve(async (req) => {
  // Get dynamic CORS headers based on request origin
  const dynamicCorsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: dynamicCorsHeaders });
  }

  try {
    // Enforce POST and authenticate via service role key
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method Not Allowed' }),
        { status: 405, headers: { ...dynamicCorsHeaders, 'Allow': 'POST, OPTIONS', 'Content-Type': 'application/json' } }
      );
    }
    const authHeader = req.headers.get('authorization') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Unsupported Media Type, expected application/json' }),
        { status: 415, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { job_id }: InferenceStartedRequest = await req.json();
    const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!job_id || !UUID_V4_REGEX.test(job_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid job_id: expected UUID' }),
        { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch job to verify existence and current status
    const { data: job, error: jobError } = await supabase
      .from('inference_jobs')
      .select('id, status')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Inference job not found' }),
        { status: 404, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If already running or terminal, do nothing
    if (job.status === 'running' || job.status === 'completed' || job.status === 'failed') {
      return new Response(
        JSON.stringify({ ok: true, message: `Job already ${job.status}` }),
        { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update to running when provider actually begins execution (only from startable states)
    const { data: updated, error: updErr } = await supabase
      .from('inference_jobs')
      .update({ status: 'running', updated_at: new Date().toISOString() })
      .eq('id', job_id)
      .in('status', ['queued', 'initializing', 'pending'])
      .select('id, status')
      .maybeSingle();

    if (!updErr && !updated) {
      return new Response(
        JSON.stringify({ ok: true, message: 'Job not in startable state' }),
        { status: 409, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (updErr) {
      return new Response(
        JSON.stringify({ error: 'Failed to update inference job to running' }),
        { status: 500, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, job_id, status: 'running' }),
      { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Inference started error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


