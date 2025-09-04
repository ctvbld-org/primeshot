import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { buildPronoun, buildSubjectPrompt, buildGlassesPrompt, buildFinalPrompt } from "../_shared/prompt.ts";

interface PreviewRequest {
  character_id: string;
  style_id: string;
  wardrobe_id?: string; // value code
  scene_id?: string;    // value code
  color_id?: string;    // value code
}

serve(async (req) => {
  // CORS preflight
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

    const { character_id, style_id, wardrobe_id, scene_id, color_id }: PreviewRequest = await req.json();
    if (!character_id || !style_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: character_id, style_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    console.log('🔌 Preview SUPABASE_URL:', supabaseUrl)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch needed data
    const [{ data: style, error: styleError }, { data: character, error: characterError }] = await Promise.all([
      supabase.from('styles').select('id, prompt').eq('id', style_id).single(),
      supabase.from('characters').select('metadata').eq('id', character_id).single(),
    ]);

    if (styleError || !style) {
      return new Response(JSON.stringify({ error: 'Style not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (characterError || !character) {
      return new Response(JSON.stringify({ error: 'Character not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stylePrompt = String(style.prompt || '');
    // Wardrobe/color by value (mirror inference-create)
    let wardrobePrompt = '';
    if (wardrobe_id) {
      const { data: w } = await supabase.from('style_wardrobes').select('*').eq('value', wardrobe_id).maybeSingle();
      if (w) wardrobePrompt = (w.prompt || w.name || w.title || '').toString();
    }
    let colorValue = '';
    if (color_id) {
      const { data: c } = await supabase.from('style_colors').select('value').eq('value', color_id).maybeSingle();
      if (c) colorValue = (c.value || '').toString();
    }
    const gender = character?.metadata?.gender as string | undefined;
    const pronoun = buildPronoun(gender);
    if (wardrobePrompt && colorValue) wardrobePrompt = wardrobePrompt.replace(/\[color\]/g, colorValue);
    const wearLine = wardrobePrompt ? `${pronoun} is wearing ${wardrobePrompt}.` : '';

    // Scene by value
    let scenePrompt = '';
    if (scene_id) {
      const { data: s } = await supabase.from('style_scenes').select('*').eq('value', scene_id).maybeSingle();
      if (s) scenePrompt = (s.prompt || s.name || s.title || '').toString();
    }

    const { subject: subjectPrompt } = buildSubjectPrompt(character?.metadata || {});
    // Glasses are merged into subject by shared builder; avoid duplicate line
    const wardrobeClean = wearLine.replace(/\.+$/, '.');
    const finalPrompt = buildFinalPrompt({
      style: stylePrompt,
      subject: subjectPrompt,
      wardrobe: wardrobeClean,
      scene: scenePrompt,
    });

    return new Response(
      JSON.stringify({ 
        prompt: finalPrompt, 
        metadata: character?.metadata || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('inference-prompt-preview error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


