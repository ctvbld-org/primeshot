import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { calculateImageCreditCost, getSubscriptionLimits, getInferenceSettings, type Quality } from "../_shared/pricing.ts";
import { buildPronoun, buildSubjectPrompt, buildGlassesPrompt, buildFinalPrompt, safeJoin } from "../_shared/prompt.ts";

interface InferenceRequest {
  user_id: string;
  character_id: string;
  style_id: string;
  wardrobe_id?: string;
  color_id?: string;
  scene_id?: string;
  params?: Record<string, unknown>; // seed?, quality, nb_takes, aspect_ratio
  queue_type?: 'fast' | 'slow' | 'ultra';
  prompt_override?: { enabled: boolean; prompt: string };
}

interface InferenceJob {
  id: string;
  user_id: string;
  style_id: string;
  status: 'initializing' | 'queued' | 'pending' | 'completed' | 'failed';
  progress: number;
  modal_job_id?: string;
  quality: string;
  nb_takes: number;
  aspect_ratio: string;
  workflow: string;
  character_lora: string;
  style_lora: string;
  prompt: string;
  negative_prompt: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
  queue_type: 'fast' | 'slow' | 'ultra';
  wardrobe_id?: string;
  scene_id?: string;
  color_id?: string;
  character_id: string;
  credits_spent?: number;
}

// Credit calculation function - now uses shared configuration

// Check if user can generate at requested quality based on their subscription
async function checkQualityPermission(
  supabase: any, 
  userId: string, 
  requestedQuality: '1K' | '2K' | '4K'
): Promise<{ allowed: boolean; maxQuality?: string; userTier?: string }> {
  // Get user's active subscription
  const { data: subscription, error } = await supabase
    .from('user_subscriptions')
    .select('plan_name')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !subscription) {
    // No active subscription - only allow 1K
    return { allowed: requestedQuality === '1K', maxQuality: '1K', userTier: 'none' };
  }

  // Get plan details from database instead of Stripe
  try {
    const limits = await getSubscriptionLimits(supabase, subscription.plan_name);
    
    if (!limits) {
      console.error(`Failed to get subscription limits for plan: ${subscription.plan_name}`);
      return { allowed: false };
    }

    const maxQuality = limits.max_quality;
    
    const qualityHierarchy = { '1K': 1, '2K': 2, '4K': 3 };
    const userMaxLevel = qualityHierarchy[maxQuality as keyof typeof qualityHierarchy] || 1;
    const requestedLevel = qualityHierarchy[requestedQuality];

    return {
      allowed: requestedLevel <= userMaxLevel,
      maxQuality,
      userTier: subscription.plan_name
    };
  } catch (error) {
    console.error('Error checking quality permission:', error);
    return { allowed: false };
  }
}

// Check user's concurrent inference limits based on subscription plan
async function checkInferenceConcurrentLimits(
  supabase: any,
  userId: string
): Promise<{
  allowed: boolean;
  reason?: string;
  concurrentJobs?: number;
  currentRunningJobs?: number;
}> {
  try {
    // Get user's active subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('plan_name')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // Default to 1 concurrent job for users without an active subscription
    let concurrentJobs = 1;

    if (subscription?.plan_name) {
      const limits = await getSubscriptionLimits(supabase, subscription.plan_name);
      if (limits?.concurrent_jobs) {
        concurrentJobs = limits.concurrent_jobs;
      }
    }

    // Count user's currently active inference jobs (pending or running)
    const { count: runningCount } = await supabase
      .from('inference_jobs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .in('status', ['initializing', 'pending', 'running']);

    const currentRunningJobs = runningCount || 0;

    if (currentRunningJobs >= concurrentJobs) {
      return {
        allowed: false,
        reason: `Concurrent inference limit reached (${currentRunningJobs}/${concurrentJobs})`,
        concurrentJobs,
        currentRunningJobs,
      };
    }

    return { allowed: true, concurrentJobs, currentRunningJobs };
  } catch (error) {
    console.error('Error checking inference concurrent limits:', error);
    // Fail-safe: allow but with reason set
    return { allowed: true, reason: 'Failed to verify concurrent limits' };
  }
}

// Find an existing active inference job for idempotency (initializing/queued/pending/running)
async function findExistingActiveInferenceJob(
  supabase: any,
  userId: string,
  characterId: string,
  styleId: string
): Promise<InferenceJob | null> {
  const { data, error } = await supabase
    .from('inference_jobs')
    .select('id, user_id, character_id, style_id, status, modal_job_id, created_at, updated_at, credits_spent, error_message')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .eq('style_id', styleId)
    .in('status', ['initializing', 'queued', 'pending', 'running'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking existing active inference job:', error);
    return null;
  }
  return (data as InferenceJob) || null;
}

serve(async (req) => {
  // Get dynamic CORS headers based on request origin
  const dynamicCorsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: dynamicCorsHeaders });
  }

  const env = Deno.env.get('ENV') ?? 'prod';

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: InferenceRequest = await req.json();
    const { user_id, character_id, style_id } = body;
    console.log('🎯 inference-create inputs:', { user_id, character_id, style_id, styleIdType: typeof style_id });

    // Validate required fields
    if (!user_id || !character_id || !style_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, character_id, and style_id' }),
        { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enforce user authentication: require valid JWT and ensure it matches body.user_id unless caller is admin
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : authHeader;
    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (authData.user.id !== user_id) {
      const { data: u, error: adminErr } = await supabase
        .from('users')
        .select('admin')
        .eq('id', authData.user.id)
        .single();
      if (adminErr || !u?.admin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Extract params/settings with DB-driven defaults
    const settings = await getInferenceSettings(supabase);
    const quality = (body.params as any)?.quality || settings.defaults.quality;
    const nbTakes = (body.params as any)?.nb_takes || settings.defaults.nb_takes;
    const aspectRatio = (body.params as any)?.aspect_ratio || settings.defaults.aspect_ratio;
    // Force fast queue globally
    const queueType: 'fast' = 'fast';

    // Validate using DB-defined options
    if (!Number.isInteger(nbTakes) || !settings.nb_takes_options.includes(nbTakes)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid nb_takes',
          details: `nb_takes must be one of: ${settings.nb_takes_options.join(', ')}`,
          provided_number_of_takes: nbTakes
        }),
        { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings.qualities.includes(quality)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid quality',
          details: `quality must be one of: ${settings.qualities.join(', ')}`,
          provided_quality: quality
        }),
        { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate credit cost for this operation
    const creditCost = await calculateImageCreditCost(supabase, quality as Quality, nbTakes);

    // Check user's credit balance
    const { data: balanceData, error: balanceError } = await supabase
      .rpc('get_user_available_credits', { user_uuid: user_id });

    if (balanceError) {
      console.error('Error getting user credit balance:', balanceError);
      return new Response(
        JSON.stringify({ error: 'Failed to check credit balance' }),
        {
          status: 500,
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const currentBalance = balanceData || 0;

    if (currentBalance < creditCost) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits',
          details: `Required: ${creditCost} credits, Available: ${currentBalance} credits`,
          required_credits: creditCost,
          available_credits: currentBalance
        }),
        { status: 402, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check resolution permission based on user's subscription
    const qualityCheck = await checkQualityPermission(supabase, user_id, quality);
    if (!qualityCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: `Quality ${quality} not allowed for your subscription tier`,
          details: `Your plan allows up to ${qualityCheck.maxQuality} quality`,
          max_allowed_quality: qualityCheck.maxQuality,
          user_tier: qualityCheck.userTier
        }),
        { status: 403, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns the character; allow not-ready characters (we'll queue the job)
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('id, user_id, status, lora_path, metadata')
      .eq('id', character_id)
      .eq('user_id', user_id)
      .single();

    if (characterError || !character) {
      return new Response(
        JSON.stringify({ error: 'Character not found or access denied' }),
        { status: 404, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get style configuration from the styles table
    const { data: style, error: styleError } = await supabase
      .from('styles')
      .select('id, prompt, lora_path')
      .eq('id', style_id)
      .single();
    console.log('📝 inference-create style row:', style);
    if (styleError) console.log('❗inference-create styleError:', styleError);

    if (styleError || !style) {
      return new Response(
        JSON.stringify({ error: 'Style not found' }),
        { status: 404, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Allow multiple jobs even with identical params; concurrency limits handle execution order

    // Generate job ID up front for traceability across spend/insert/provider
    const jobId = crypto.randomUUID();

    // Spend credits BEFORE starting the job (non-refundable, aligned with training)
    const { data: spendResult, error: spendError } = await supabase
      .rpc('spend_user_credits', {
        p_user_id: user_id,
        p_amount: creditCost,
        p_usage_type: 'image_generation',
        p_description: `Image generation - ${quality} quality, ${nbTakes} images`,
        p_metadata: {
          character_id,
          style_id,
          quality,
          nb_takes: nbTakes,
          aspect_ratio: aspectRatio,
          style_name: style.name,
          job_id: jobId
        }
      });

    if (spendError || !spendResult) {
      console.error('Error spending credits:', spendError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to spend credits',
          details: 'Insufficient balance or system error'
        }),
        { status: 500, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isCharacterReady = character.status === 'ready' && !!character.lora_path;

    // Resolve option ids (UUIDs) up front so queued jobs also persist them
    let resolvedWardrobeUuid: string | null = null;
    if (body.wardrobe_id) {
      const { data: wardrobeRow } = await supabase
        .from('style_wardrobes')
        .select('id')
        .eq('value', body.wardrobe_id)
        .maybeSingle();
      resolvedWardrobeUuid = wardrobeRow?.id ?? null;
    }

    let resolvedColorUuid: string | null = null;
    if (body.color_id) {
      const { data: colorRow } = await supabase
        .from('style_colors')
        .select('id')
        .eq('value', body.color_id)
        .maybeSingle();
      resolvedColorUuid = colorRow?.id ?? null;
    }

    let resolvedSceneUuid: string | null = null;
    if (body.scene_id) {
      const { data: sceneRow } = await supabase
        .from('style_scenes')
        .select('id')
        .eq('value', body.scene_id)
        .maybeSingle();
      resolvedSceneUuid = sceneRow?.id ?? null;
    }

    // ----- If character not ready: create job as queued and return early -----
    if (!isCharacterReady) {
      const queuedJob: Partial<InferenceJob> = {
        id: jobId,
        user_id,
        character_id,
        style_id,
        wardrobe_id: resolvedWardrobeUuid || undefined,
        scene_id: resolvedSceneUuid || undefined,
        color_id: resolvedColorUuid || undefined,
        status: 'queued',
        quality,
        nb_takes: nbTakes,
        aspect_ratio: aspectRatio,
        queue_type: queueType,
        credits_spent: creditCost,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: qInsertError } = await supabase
        .from('inference_jobs')
        .insert(queuedJob);

      if (qInsertError) {
        console.error('Failed to create queued inference job:', qInsertError);
        // Attempt refund on failure to create job
        const idempotencyKey = `refund_${jobId}`;
        await supabase.rpc('refund_credits_with_idempotency', {
          p_user_id: user_id,
          p_job_id: jobId,
          p_amount: creditCost,
          p_reason: 'Refund for failed job creation (character not ready)',
          p_idempotency_key: idempotencyKey
        });
        return new Response(
          JSON.stringify({ error: 'Failed to create inference job' }),
          { status: 500, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          job_id: jobId,
          status: 'queued',
          message: "Waiting for character to finish training",
          i18n_key: 'status.tooltip.queueReasons.character_not_ready',
          i18n_params: {},
          credits_spent: creditCost,
          remaining_credits: currentBalance - creditCost,
          queue_info: { reason: 'character_not_ready' }
        }),
        { status: 200, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ----- Build prepared payload (prompt + workflow + loras) -----
    // 1) Required character LoRA
    const characterLora = character.lora_path as string | null;

    // 2) Optional style LoRA
    // Style row loaded; resolve style LoRA
    const styleLora = (style as any)?.lora_path ?? '';

    // 3) Optional wardrobe/color/scene pieces - lookup by value to get UUID and prompt
    let wardrobePrompt = '';
    let wardrobeUuid: string | null = resolvedWardrobeUuid;
    if (body.wardrobe_id) {
      const { data: wardrobeRow } = await supabase.from('style_wardrobes').select('*').eq('value', body.wardrobe_id).maybeSingle();
      if (wardrobeRow) {
        wardrobeUuid = wardrobeRow.id;
        wardrobePrompt = (wardrobeRow.prompt).toString();
      }
    }
    
    let colorValue = '';
    let colorUuid: string | null = resolvedColorUuid;
    if (body.color_id) {
      const { data: colorRow } = await supabase.from('style_colors').select('*').eq('value', body.color_id).maybeSingle();
      if (colorRow) {
        colorUuid = colorRow.id;
        colorValue = (colorRow.value).toString();
      }
    }

    // Replace [color] placeholder in wardrobe prompt with actual color value
    const gender = character?.metadata?.gender as string | undefined;
    const pronoun = buildPronoun(gender);
    if (wardrobePrompt && colorValue) {
      wardrobePrompt = wardrobePrompt.replace(/\[color\]/g, colorValue);
    }
    wardrobePrompt = wardrobePrompt ? `${pronoun} is wearing ${wardrobePrompt}` : '';
    
    let scenePrompt = '';
    let sceneUuid: string | null = resolvedSceneUuid;
    if (body.scene_id) {
      const { data: sceneRow } = await supabase.from('style_scenes').select('*').eq('value', body.scene_id).maybeSingle();
      if (sceneRow) {
        sceneUuid = sceneRow.id;
        scenePrompt = (sceneRow.prompt).toString();
      }
    }

    // 4) Style prompt defaults
    const stylePrompt = (style as any)?.prompt || '';
    const negativePrompt = (style as any)?.negative_prompt || '';

    // 5) Build subject prompt from character.metadata
    const { subject: subjectPrompt } = buildSubjectPrompt(character?.metadata || {});
    // glasses already merged into subject via shared builder; glassesPrompt kept for compatibility if needed
    const glassesPrompt = '';

    // 6) Final prompt assembly (admin override supported)
    // Ensure style prompt appears first; trim duplicate trailing dots in wardrobe
    const wardrobeClean = wardrobePrompt ? (wardrobePrompt.endsWith('.') ? wardrobePrompt : `${wardrobePrompt}.`) : '';
    let finalPrompt = buildFinalPrompt({ style: stylePrompt, subject: subjectPrompt, wardrobe: wardrobeClean, scene: scenePrompt });

    // Admin-only prompt override: verify caller is admin using JWT
    if (body?.prompt_override?.enabled) {
      try {
        const authHeaderRaw = req.headers.get('Authorization') || '';
        const jwt = authHeaderRaw.startsWith('Bearer ')
          ? authHeaderRaw.substring('Bearer '.length)
          : authHeaderRaw;
        // Use service role client for admin check
        const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
        if (authError) {
          console.warn('Failed to verify JWT for admin override:', authError.message);
        }
        const callerId = authData?.user?.id;
        if (callerId && callerId === user_id && body?.prompt_override?.prompt) {
          const { data: u, error: userErr } = await supabase
            .from('users')
            .select('admin')
            .eq('id', user_id)
            .single();
          if (userErr) {
            console.warn('Admin lookup failed:', userErr.message);
          }
          if (u?.admin) {
            finalPrompt = String(body.prompt_override.prompt);
            console.log('Admin prompt override applied for user:', user_id);
          }
        }
      } catch (error) {
        console.warn('Error during admin verification:', error);
      }
    }

    // 7) Workflow resolver (future-proof)
    function resolveWorkflow(s: any, params: any): string {
      const key = s?.workflow || s?.workflow_key || s?.workflow_s3_key;
      if (typeof key === 'string' && key.length > 0) return key;
      // Default to WAN2.1.json stored under workflows/ prefix; loader accepts with/without prefix
      return 'WAN2.1.json';
    }
    const workflowKey = resolveWorkflow(style, (body as any)?.params || {});

    // Determine if we need to queue based on user's concurrent limits
    const concurrentLimits = await checkInferenceConcurrentLimits(supabase, user_id);
    const shouldQueue = !concurrentLimits.allowed;

    // Create inference job record with credits spent
    const inferenceJob: Partial<InferenceJob> = {
      id: jobId,
      user_id,
      character_id,
      style_id,
      wardrobe_id: wardrobeUuid || undefined,
      scene_id: sceneUuid || undefined,
      color_id: colorUuid || undefined,
      status: 'initializing',
      quality,
      nb_takes: nbTakes,
      aspect_ratio: aspectRatio,
      queue_type: queueType,
      credits_spent: creditCost,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(body?.prompt_override?.enabled && body?.prompt_override?.prompt ? { prompt_override: { enabled: true, prompt: String(body.prompt_override.prompt) } } : {})
    };

    const { error: insertError } = await supabase
      .from('inference_jobs')
      .insert(inferenceJob);

    if (insertError) {
      console.error('Failed to create inference job:', insertError);
      
      // Refund credits if job creation failed with idempotency protection
      const idempotencyKey = `refund_${jobId}`;
      const { data: refundResult, error: refundError } = await supabase
        .rpc('refund_credits_with_idempotency', {
          p_user_id: user_id,
          p_job_id: jobId,
          p_amount: creditCost,
          p_reason: `Refund for failed job creation - ${quality} quality`,
          p_idempotency_key: idempotencyKey
        });

      if (refundError) {
        console.error('Failed to process refund:', refundError);
        // Continue with error response even if refund failed - this is logged for manual review
      } else if (refundResult?.[0]?.success) {
        console.log(`Refund processed for job ${jobId}: ${refundResult[0].refund_created ? 'new' : 'duplicate'} refund`);
      }

      return new Response(
        JSON.stringify({ error: 'Failed to create inference job' }),
        { status: 500, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (shouldQueue) {
      // Update status to queued when enqueued due to user concurrent limit
      await supabase
        .from('inference_jobs')
        .update({ status: 'queued', updated_at: new Date().toISOString() })
        .eq('id', jobId);
      // Queued due to per-user concurrent limit
      return new Response(
        JSON.stringify({
          job_id: jobId,
          status: 'queued',
          credits_spent: creditCost,
          remaining_credits: currentBalance - creditCost,
          queue_info: {
            current_running_jobs: concurrentLimits.currentRunningJobs,
            concurrent_jobs: concurrentLimits.concurrentJobs,
          },
          message: 'Concurrent job limit reached. Will start when slots are available.',
          i18n_key: 'status.tooltip.queueReasons.concurrent_limit',
          i18n_params: { current: concurrentLimits.currentRunningJobs, limit: concurrentLimits.concurrentJobs },
        }),
        { status: 200, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Post-insert per-user concurrency reconciliation to avoid race conditions (align with training)
    try {
      const userLimit = concurrentLimits.concurrentJobs ?? 1;
      const { count: activeNow } = await supabase
        .from('inference_jobs')
        .select('id', { count: 'exact' })
        .eq('user_id', user_id)
        .in('status', ['initializing', 'pending', 'running']);
      const activeCount = activeNow || 0;
      if (activeCount > userLimit) {
        await supabase
          .from('inference_jobs')
          .update({ status: 'queued', updated_at: new Date().toISOString() })
          .eq('id', jobId);
        return new Response(
          JSON.stringify({
            job_id: jobId,
            status: 'queued',
            message: 'Queued',
            i18n_key: 'status.tooltip.queueReasons.concurrent_limit',
            i18n_params: { current: activeCount - 1, limit: userLimit },
            queue_info: {
              concurrent_running: activeCount - 1,
              concurrent_limit: userLimit,
            }
          }),
          { headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (e) {
      console.warn('Post-insert inference concurrency check failed; proceeding to submit:', e);
    }

    // Call Modal ComfyUI API for real inference (Option B payload)
    try {
      const inferenceApiUrl = Deno.env.get('INFERENCE_API_URL');
      if (!inferenceApiUrl) {
        throw new Error('INFERENCE_API_URL environment variable not set');
      }

      // Determine environment based on Supabase URL
      const env = Deno.env.get('SUPABASE_URL')?.includes('localhost') ? 'dev' : 'prod';

      // Prepare Modal API request with quality and nbTakes
      const modalRequest = {
        user_id,
        job_id: jobId,
        character_id,
        style_id,
        wardrobe_id: body.wardrobe_id,
        color_id: body.color_id,
        scene_id: body.scene_id,
        env: env, // Add environment flag like training
        params: {
          nb_takes: nbTakes,
          aspect_ratio: aspectRatio,
          quality: quality,
          seed: (body.params as any)?.seed ?? -1
        },
        prepared: {
          workflow: workflowKey,
          prompt: finalPrompt,
          negative_prompt: negativePrompt,
          character_lora: characterLora,
          style_lora: styleLora || ''
        }
      } as Record<string, unknown>;

      // Submit to Modal API

      // Get Modal authentication tokens
      const modalTokenId = Deno.env.get('MODAL_TOKEN_ID');
      const modalTokenSecret = Deno.env.get('MODAL_TOKEN_SECRET');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add Modal authentication if tokens are available
      if (modalTokenId && modalTokenSecret) {
        headers['Modal-Key'] = modalTokenId;
        headers['Modal-Secret'] = modalTokenSecret;
      }

      // Add network timeout to prevent hanging edge invocation if provider stalls
      let controller: AbortController | null = new AbortController();
      let timeout: ReturnType<typeof setTimeout> | undefined = setTimeout(() => controller!.abort('timeout'), 30000);

      const modalResponse = await fetch(inferenceApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(modalRequest),
        signal: controller!.signal
      });

      if (!modalResponse.ok) {
        const errorText = await modalResponse.text();
        console.error('Modal API error:', { status: modalResponse.status, statusText: modalResponse.statusText, body: errorText });
        // Treat as transient: queue for retry (do not refund here; aligned with training)
        await supabase
          .from('inference_jobs')
          .update({ status: 'queued', error_message: `Modal API error: ${modalResponse.status} ${modalResponse.statusText}`, updated_at: new Date().toISOString() })
          .eq('id', jobId);
        return new Response(
          JSON.stringify({
            job_id: jobId,
            status: 'queued',
            message: 'Temporary issue submitting to provider. We will retry automatically.',
            i18n_key: 'status.tooltip.queueReasons.provider_temporary_issue',
            i18n_params: {},
          }),
          { status: 200, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark job as pending after successful submission to provider
      await supabase
        .from('inference_jobs')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', jobId);

      const modalResult = await modalResponse.json();

      // Update job with Modal job ID if provided, but keep status 'pending'
      if (modalResult.job_id) {
        await supabase
          .from('inference_jobs')
          .update({
            modal_job_id: modalResult.job_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      }

      return new Response(
        JSON.stringify({
          job_id: jobId,
          modal_job_id: modalResult.job_id,
          status: 'pending',
          estimated_duration: 45, // TODO: Update when provider exposes
          credits_spent: creditCost,
          remaining_credits: currentBalance - creditCost,
          quality: quality,
          nb_takes: nbTakes,
          aspect_ratio: aspectRatio,
          queue_type: queueType,
          message: 'Pending',
          i18n_key: 'status.tooltip.pending',
          i18n_params: {},
        }),
        {
          status: 200,
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (modalError) {
      const errorMessage = (modalError as any)?.message ?? String(modalError);
      console.error('Modal API call failed:', modalError);
      // Treat as transient: queue and return 200 (no refund here)
      await supabase
        .from('inference_jobs')
        .update({ status: 'queued', error_message: `Failed to call Modal API: ${errorMessage}`, updated_at: new Date().toISOString() })
        .eq('id', jobId);
      return new Response(
        JSON.stringify({
          job_id: jobId,
          status: 'queued',
          message: 'Temporary issue submitting to provider. We will retry automatically.',
          i18n_key: 'status.tooltip.queueReasons.provider_temporary_issue',
          i18n_params: {},
        }),
        { status: 200, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    } finally {
      try {
        if (typeof timeout !== 'undefined') clearTimeout(timeout);
      } catch (_e) {
        // no-op
      }
    }

  } catch (error) {
    console.error('Inference start error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 