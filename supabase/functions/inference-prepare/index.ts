import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type Params = Record<string, unknown>;

interface PrepareRequest {
  user_id: string;
  job_id?: string;
  character_id: string;
  style_id: string;
  wardrobe_id: string;
  color_id: string;
  scene_id: string;
  params?: Params;
}

interface PrepareResponse {
  prompt: string;
  negative_prompt: string;
  workflow_s3_key: string; // e.g. workflows/<style_id>/workflow.json
  images_count: number; // nb_takes
  seed?: number;
  // Optional hints
  model?: string;
  lora_s3_key?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: PrepareRequest = await req.json();
    const {
      user_id,
      character_id,
      style_id,
      wardrobe_id,
      color_id,
      scene_id,
      params
    } = body || {} as PrepareRequest;

    if (!user_id || !character_id || !style_id || !wardrobe_id || !color_id || !scene_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch records. Table/column names assumed; adjust as needed.
    const [{ data: style }, { data: wardrobe }, { data: color }, { data: scene }, { data: character }] = await Promise.all([
      supabase.from('styles').select('*').eq('id', style_id).maybeSingle(),
      supabase.from('wardrobes').select('*').eq('id', wardrobe_id).maybeSingle(),
      supabase.from('colors').select('*').eq('id', color_id).maybeSingle(),
      supabase.from('scenes').select('*').eq('id', scene_id).maybeSingle(),
      supabase.from('characters').select('*').eq('id', character_id).maybeSingle(),
    ]);

    // Build prompt pieces using safe fallbacks
    const stylePrompt = (style?.prompt || style?.name || '').trim();
    const wardrobePrompt = (wardrobe?.prompt || wardrobe?.name || '').trim();
    const colorPrompt = (color?.prompt || color?.name || '').trim();
    const scenePrompt = (scene?.prompt || scene?.name || '').trim();

    const negative_prompt = (style?.negative_prompt || scene?.negative_prompt || '')
      || 'low quality, blurry, artifacts, disfigured, extra limbs, watermark, text';

    const joined = [stylePrompt, wardrobePrompt, colorPrompt, scenePrompt]
      .filter(Boolean)
      .join(', ');

    const prompt = joined || 'professional portrait, studio lighting';

    // Map nb_takes
    const images_count_raw = (params as any)?.nb_takes ?? (params as any)?.images_count ?? 1;
    const images_count = Number.isFinite(Number(images_count_raw)) && Number(images_count_raw) > 0
      ? Number(images_count_raw)
      : 1;

    // Resolve workflow key by style; default if missing
    const workflow_s3_key = style?.workflow_s3_key
      || `workflows/${style_id}/workflow.json`;

    // Optional LoRA key from character/style association
    const lora_s3_key = character?.lora_s3_key || style?.lora_s3_key || null;

    const resp: PrepareResponse = {
      prompt,
      negative_prompt,
      workflow_s3_key,
      images_count,
      seed: typeof (params as any)?.seed === 'number' ? (params as any).seed as number : undefined,
      model: style?.model || undefined,
      lora_s3_key: lora_s3_key || undefined,
    };

    return new Response(JSON.stringify(resp), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('inference-prepare error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


