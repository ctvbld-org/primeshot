import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface TrainingStartedRequest {
  job_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authorization: service role only (consistent with inference EFs)
    const authHeader = req.headers.get('Authorization') || '';
    const serviceExpected = `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''}`;
    if (!serviceExpected.trim() || authHeader !== serviceExpected) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { job_id }: TrainingStartedRequest = await req.json();
    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: job_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate job_id format (UUID v4)
    const uuidV4Re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof job_id !== 'string' || !uuidV4Re.test(job_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid job_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch job to get current status and character_id
    const { data: job, error: jobError } = await supabaseAdmin
      .from('training_jobs')
      .select('id, status, character_id')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Training job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If already running or terminal, do nothing
    if (job.status === 'running' || job.status === 'completed' || job.status === 'failed') {
      return new Response(
        JSON.stringify({ ok: true, message: `Job already ${job.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update job to running atomically if currently queued/pending/initializing; DB trigger will set started_at
    const { data: updated, error: updErr } = await supabaseAdmin
      .from('training_jobs')
      .update({ status: 'running', updated_at: new Date().toISOString() })
      .eq('id', job_id)
      .in('status', ['queued', 'pending', 'initializing'])
      .select('id');

    if (updErr) {
      return new Response(
        JSON.stringify({ error: 'Failed to update training job to running' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!updated || updated.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Precondition failed' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reflect character status as training (best-effort)
    if (job.character_id) {
      await supabaseAdmin
        .from('characters')
        .update({ status: 'training', updated_at: new Date().toISOString() })
        .eq('id', job.character_id);
    }

    return new Response(
      JSON.stringify({ success: true, job_id, status: 'running' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Training started error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


