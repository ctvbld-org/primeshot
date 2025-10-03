

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "app";


ALTER SCHEMA "app" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."array_distinct"("arr" "text"[]) RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN ARRAY(SELECT DISTINCT unnest(arr));
END;
$$;


ALTER FUNCTION "public"."array_distinct"("arr" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."array_distinct"("arr" "anyarray") RETURNS "anyarray"
    LANGUAGE "plpgsql" IMMUTABLE PARALLEL SAFE
    AS $$
BEGIN
    RETURN (
        WITH flow_order AS (
            SELECT stage, ordering
            FROM (VALUES
                ('shoot', 1),
                ('payment', 2),
                ('upload', 3),
                ('review', 4),
                ('albums', 5)
            ) AS t(stage, ordering)
        )
        SELECT array_agg(DISTINCT elem ORDER BY 
            COALESCE((SELECT ordering FROM flow_order WHERE stage = elem::text), 999)
        )
        FROM unnest(arr) AS elem
        WHERE elem IS NOT NULL
    );
END;
$$;


ALTER FUNCTION "public"."array_distinct"("arr" "anyarray") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_subscription_credits"("p_user_id" "uuid", "p_subscription_id" "text", "p_credits" integer, "p_expires_at" timestamp with time zone, "p_period_start" timestamp with time zone, "p_period_end" timestamp with time zone, "p_description" "text", "p_metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Update subscription periods atomically
  UPDATE user_subscriptions 
  SET 
    current_period_start = p_period_start,
    current_period_end = p_period_end,
    updated_at = now()
  WHERE stripe_subscription_id = p_subscription_id;
  
  -- Verify the update affected exactly one row
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;
  
  -- Award credits atomically in same transaction
  INSERT INTO user_credits (
    user_id, credits, transaction_type, source_type, 
    source_id, expires_at, description, metadata
  ) VALUES (
    p_user_id, p_credits, 'earned', 'subscription',
    p_subscription_id, p_expires_at, p_description, p_metadata
  );
END;
$$;


ALTER FUNCTION "public"."award_subscription_credits"("p_user_id" "uuid", "p_subscription_id" "text", "p_credits" integer, "p_expires_at" timestamp with time zone, "p_period_start" timestamp with time zone, "p_period_end" timestamp with time zone, "p_description" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_user_credit_balance"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  select coalesce(
    sum(
      case
        when transaction_type = 'earned' then credits
        when transaction_type = 'spent'  then -credits
        when transaction_type = 'expired' then 0
        else 0
      end
    ), 0)
  from public.user_credits
  where user_id = user_uuid
    and (expires_at is null or expires_at > now());
$$;


ALTER FUNCTION "public"."calculate_user_credit_balance"("user_uuid" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."inference_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "character_id" "uuid" NOT NULL,
    "style_id" "uuid",
    "status" "text" DEFAULT 'initializing'::"text" NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "wardrobe_id" "uuid",
    "scene_id" "uuid",
    "color_id" "uuid",
    "credits_spent" integer DEFAULT 0 NOT NULL,
    "retry_after" timestamp with time zone,
    "quality" "text",
    "nb_takes" integer,
    "aspect_ratio" "text",
    "queue_type" "text",
    "modal_job_id" "text",
    "prompt_override" "jsonb",
    "settings_override" "jsonb",
    CONSTRAINT "inference_jobs_credits_spent_nonneg" CHECK (("credits_spent" >= 0)),
    CONSTRAINT "inference_jobs_status_check" CHECK (("status" = ANY (ARRAY['initializing'::"text", 'queued'::"text", 'pending'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text", 'deleted'::"text"])))
);


ALTER TABLE "public"."inference_jobs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."inference_jobs"."prompt_override" IS 'Optional admin-provided prompt override: { enabled: boolean, prompt: string }';



COMMENT ON COLUMN "public"."inference_jobs"."settings_override" IS 'Admin-provided settings overrides (e.g., character/style lora strengths). Null when not provided.';



CREATE OR REPLACE FUNCTION "public"."claim_next_queued_inference_job"() RETURNS "public"."inference_jobs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_job public.inference_jobs%rowtype;
BEGIN
  WITH heads AS (
    SELECT * FROM (
      SELECT j.*, ROW_NUMBER() OVER (PARTITION BY j.user_id ORDER BY j.created_at) AS rn
      FROM public.inference_jobs j
      WHERE j.status = 'queued'
        AND (j.retry_after IS NULL OR j.retry_after <= now())
    ) t WHERE rn = 1
  ), eligible AS (
    SELECT h.*
    FROM heads h
    JOIN public.user_subscriptions us ON us.user_id = h.user_id AND us.status = 'active'
    JOIN public.subscriptions s ON s.name = us.plan_name
    LEFT JOIN (
      SELECT user_id, COUNT(1) AS active
      FROM public.inference_jobs
      WHERE status IN ('initializing','pending','running')
      GROUP BY user_id
    ) a ON a.user_id = h.user_id
    WHERE COALESCE(a.active, 0) < COALESCE(s.concurrent_jobs, 1)
  )
  SELECT * INTO v_job FROM eligible
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.inference_jobs
  SET status = 'initializing', updated_at = now()
  WHERE id = v_job.id
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$;


ALTER FUNCTION "public"."claim_next_queued_inference_job"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "character_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'initializing'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "modal_job_id" "text",
    "error_message" "text",
    "credits_spent" integer DEFAULT 0,
    "gpu_type" "text",
    "retry_count" integer DEFAULT 0 NOT NULL,
    "retry_after" timestamp with time zone,
    "training_params" "jsonb",
    CONSTRAINT "training_jobs_status_check" CHECK (("status" = ANY (ARRAY['initializing'::"text", 'queued'::"text", 'pending'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."training_jobs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."training_jobs"."training_params" IS 'Optional admin-provided training overrides (e.g., batch_size, min_steps, resize_size, rank)';



CREATE OR REPLACE FUNCTION "public"."claim_next_queued_training_job"() RETURNS "public"."training_jobs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_job public.training_jobs%rowtype;
BEGIN
  WITH heads AS (
    SELECT * FROM (
      SELECT j.*, ROW_NUMBER() OVER (PARTITION BY j.user_id ORDER BY j.created_at) AS rn
      FROM public.training_jobs j
      WHERE j.status = 'queued'
        AND (j.retry_after IS NULL OR j.retry_after <= now())
    ) t WHERE rn = 1
  ), eligible AS (
    SELECT h.*
    FROM heads h
    JOIN public.user_subscriptions us ON us.user_id = h.user_id AND us.status = 'active'
    JOIN public.subscriptions s ON s.name = us.plan_name
    LEFT JOIN (
      SELECT user_id, COUNT(1) AS active
      FROM public.training_jobs
      WHERE status IN ('initializing','pending','running')
      GROUP BY user_id
    ) a ON a.user_id = h.user_id
    WHERE COALESCE(a.active, 0) < COALESCE(s.concurrent_trainings, 1)
  )
  SELECT * INTO v_job FROM eligible
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.training_jobs
  SET status = 'initializing', updated_at = now()
  WHERE id = v_job.id
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$;


ALTER FUNCTION "public"."claim_next_queued_training_job"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_stuck_inference_jobs"() RETURNS TABLE("job_id" "uuid", "user_id" "uuid", "status" "text", "stuck_duration" interval, "action_taken" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  timeout_minutes integer := 15; -- 15 minutes timeout
  stuck_job record;
  refund_amount integer;
BEGIN
  -- Find jobs that have been running for more than timeout_minutes
  FOR stuck_job IN
    SELECT 
      ij.id,
      ij.user_id,
      ij.status,
      ij.updated_at,
      ij.credits_spent,
      (now() - ij.updated_at) as stuck_duration
    FROM public.inference_jobs ij
    WHERE ij.status = 'running'
      AND ij.updated_at < (now() - interval '1 minute' * timeout_minutes)
  LOOP
    -- Mark job as failed
    UPDATE public.inference_jobs 
    SET 
      status = 'failed',
      error_message = 'Job timed out after ' || timeout_minutes || ' minutes',
      updated_at = now()
    WHERE id = stuck_job.id;
    
    -- Refund credits if any were spent
    IF stuck_job.credits_spent > 0 THEN
      INSERT INTO public.user_credits (
        user_id,
        credits,
        transaction_type,
        description,
        created_at
      ) VALUES (
        stuck_job.user_id,
        stuck_job.credits_spent,
        'earned',
        'Refund: inference job timed out (job_id: ' || stuck_job.id || ')',
        now()
      );
      refund_amount := stuck_job.credits_spent;
    ELSE
      refund_amount := 0;
    END IF;
    
    -- Return info about what was done
    RETURN QUERY SELECT 
      stuck_job.id,
      stuck_job.user_id,
      stuck_job.status,
      stuck_job.stuck_duration,
      CASE 
        WHEN refund_amount > 0 THEN 'Failed job and refunded ' || refund_amount || ' credits'
        ELSE 'Failed job (no credits to refund)'
      END;
  END LOOP;
  
  RETURN;
END;
$$;


ALTER FUNCTION "public"."cleanup_stuck_inference_jobs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_credit_pack_credits"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE user_credits 
    SET credits = 0,
        transaction_type = 'expired'
    WHERE source_type = 'credit_pack'
        AND expires_at <= NOW()
        AND credits > 0;
END;
$$;


ALTER FUNCTION "public"."expire_credit_pack_credits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_credits"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Mark expired credits
    UPDATE user_credits 
    SET credits = 0,
        transaction_type = 'expired',
        updated_at = NOW()
    WHERE expires_at <= NOW()
      AND credits > 0
      AND transaction_type != 'expired';
END;
$$;


ALTER FUNCTION "public"."expire_credits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_subscription_credits"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Mark subscription credits as expired when subscription period ends
    UPDATE user_credits 
    SET credits = 0,
        transaction_type = 'expired'
    WHERE source_type = 'subscription'
        AND expires_at <= NOW()
        AND credits > 0;
END;
$$;


ALTER FUNCTION "public"."expire_subscription_credits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."force_cleanup_upload_session"("session_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- First delete chunks (explicit deletion before session)
  DELETE FROM public.upload_chunks WHERE upload_chunks.session_id = force_cleanup_upload_session.session_id;
  
  -- Then delete the session
  DELETE FROM public.upload_sessions WHERE id = force_cleanup_upload_session.session_id;
  
  -- Log the cleanup
  RAISE NOTICE 'Force cleaned up upload session: %', session_id;
END;
$$;


ALTER FUNCTION "public"."force_cleanup_upload_session"("session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_style_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Generate a style ID in format: style_<timestamp>_<random>
  NEW.id := 'style_' || 
            TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS') || 
            '_' || 
            SUBSTR(MD5(RANDOM()::TEXT), 1, 6);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_style_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_training_jobs"() RETURNS TABLE("id" "uuid", "character_id" "uuid", "user_id" "uuid", "status" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "modal_job_id" "text", "retry_after" timestamp with time zone, "retry_count" integer)
    LANGUAGE "sql" STABLE
    AS $$
  select distinct on (tj.character_id)
    tj.id,
    tj.character_id,
    tj.user_id,
    tj.status,
    tj.created_at,
    tj.updated_at,
    tj.modal_job_id,
    tj.retry_after,
    tj.retry_count
  from public.training_jobs tj
  where tj.user_id = auth.uid()
    and tj.status in ('initializing','queued','pending','running')
  order by tj.character_id, tj.created_at desc;
$$;


ALTER FUNCTION "public"."get_active_training_jobs"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_active_training_jobs"() IS 'Returns the latest active training job per character for the current authenticated user.';



CREATE OR REPLACE FUNCTION "public"."get_language_preference"() RETURNS character varying
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    lang VARCHAR;
BEGIN
    SELECT preferred_language INTO lang
    FROM public.user_language_preferences
    WHERE user_id = auth.uid();
    
    -- Return NULL if no preference is set, allowing i18next to use its default
    RETURN lang;
END;
$$;


ALTER FUNCTION "public"."get_language_preference"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pricing_last_updated"() RETURNS "text"
    LANGUAGE "sql"
    AS $$
  with t as (
    select greatest(
      coalesce((select max(updated_at) from subscriptions), 'epoch'::timestamptz),
      coalesce((select max(updated_at) from credit_costs), 'epoch'::timestamptz),
      coalesce((select max(updated_at) from inference_settings), 'epoch'::timestamptz)
    ) as ts
  )
  select to_char(ts, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') from t;
$$;


ALTER FUNCTION "public"."get_pricing_last_updated"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_revenue_data"("start_date" timestamp with time zone, "end_date" timestamp with time zone) RETURNS TABLE("subscription_revenue" numeric, "credit_pack_revenue" numeric, "refund_amount" numeric)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT 
    COALESCE(
      (SELECT SUM(
        CASE 
          WHEN s.monthly_price IS NOT NULL THEN s.monthly_price * 100
          ELSE 0
        END
      )
      FROM public.user_subscriptions us
      JOIN public.subscriptions s ON us.plan_name = s.name
      WHERE us.status = 'active' 
      AND us.created_at >= start_date 
      AND us.created_at <= end_date), 0
    ) as subscription_revenue,
    
    COALESCE(
      (SELECT SUM(amount_paid)
      FROM public.credit_pack_purchases
      WHERE status = 'completed'
      AND created_at >= start_date 
      AND created_at <= end_date), 0
    ) as credit_pack_revenue,
    
    COALESCE(
      (SELECT SUM(ABS(credits) * 100)
      FROM public.user_credits
      WHERE transaction_type = 'refunded'
      AND created_at >= start_date 
      AND created_at <= end_date), 0
    ) as refund_amount;
$$;


ALTER FUNCTION "public"."get_revenue_data"("start_date" timestamp with time zone, "end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_users_by_generations"("limit_count" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "email" "text", "full_name" "text", "avatar_url" "text", "generation_count" bigint, "training_count" bigint, "subscription_plan" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.avatar_url,
    COUNT(DISTINCT ij.id) as generation_count,
    COUNT(DISTINCT tj.id) as training_count,
    us.plan_name as subscription_plan
  FROM public.users u
  LEFT JOIN public.inference_jobs ij ON u.id = ij.user_id
  LEFT JOIN public.training_jobs tj ON u.id = tj.user_id
  LEFT JOIN public.user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
  GROUP BY u.id, u.email, u.full_name, u.avatar_url, us.plan_name
  ORDER BY generation_count DESC, training_count DESC
  LIMIT limit_count;
$$;


ALTER FUNCTION "public"."get_top_users_by_generations"("limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_uploaded_image_counts"("character_ids" "uuid"[]) RETURNS TABLE("character_id" "uuid", "uploaded_count" integer)
    LANGUAGE "sql" STABLE
    AS $$
  select ui.character_id, count(*)::int as uploaded_count
  from public.uploaded_images ui
  join public.characters c on c.id = ui.character_id
  where ui.character_id = any(character_ids)
    and c.user_id = auth.uid()
  group by ui.character_id
  order by ui.character_id;
$$;


ALTER FUNCTION "public"."get_uploaded_image_counts"("character_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_uploaded_image_counts"("character_ids" "uuid"[]) IS 'Returns uploaded image counts per character for the provided ids, scoped to the current authenticated user via auth.uid().';



CREATE OR REPLACE FUNCTION "public"."get_user_available_credits"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    available_credits INTEGER := 0;
BEGIN
    SELECT COALESCE(SUM(CASE WHEN transaction_type = 'earned' THEN credits ELSE -credits END), 0) INTO available_credits
    FROM user_credits
    WHERE user_id = user_uuid
        AND transaction_type IN ('earned', 'spent')
        AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN GREATEST(available_credits, 0);
END;
$$;


ALTER FUNCTION "public"."get_user_available_credits"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_credit_balance"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    balance INTEGER;
BEGIN
    SELECT COALESCE(
        SUM(
            CASE 
                WHEN transaction_type = 'earned' THEN credits
                WHEN transaction_type = 'spent' THEN -credits  -- Apply negative for spent credits
                ELSE 0
            END
        ), 0
    )
    INTO balance
    FROM user_credits
    WHERE user_id = user_uuid
      AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN GREATEST(balance, 0);
END;
$$;


ALTER FUNCTION "public"."get_user_credit_balance"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_language"() RETURNS character varying
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  lang varchar;
begin
  select us.preferred_language into lang
  from public.user_settings us
  where us.user_id = auth.uid();

  return lang;
end;
$$;


ALTER FUNCTION "public"."get_user_language"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  _full_name text;
  _avatar_url text;
  _preferred_language text;
begin
  -- Extract metadata
  _full_name := coalesce(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    nullif(concat(
      coalesce(NEW.raw_user_meta_data->>'given_name',''),
      ' ',
      coalesce(NEW.raw_user_meta_data->>'family_name','')
    ), ' '),
    NEW.raw_user_meta_data->>'user_name'
  );

  _avatar_url := coalesce(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Insert into public.users (idempotent on trigger redeploy)
  insert into public.users (
    id, email, full_name, avatar_url, created_at, updated_at
  ) values (
    NEW.id,
    NEW.email,
    _full_name,
    _avatar_url,
    timezone('utc', now()),
    timezone('utc', now())
  );

  -- Initialize user_settings preferred_language if available in metadata
  _preferred_language := coalesce(
    NEW.raw_user_meta_data->>'preferred_language',
    null
  );

  insert into public.user_settings (user_id, preferred_language, created_at, updated_at)
  values (NEW.id, _preferred_language, now(), now())
  on conflict (user_id) do update set
    preferred_language = excluded.preferred_language,
    updated_at = now();

  return NEW;
exception when others then
  -- Do not block signup; log and continue
  raise log 'handle_new_user language/setup ERROR for user ID %: %', NEW.id, SQLERRM;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_image_count"("character_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE characters 
    SET image_count = image_count + 1, updated_at = now() 
    WHERE id = character_id;
END;
$$;


ALTER FUNCTION "public"."increment_image_count"("character_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."init_user_language"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  _locale text := coalesce(NEW.raw_user_meta_data->>'locale', 'en-GB');
begin
  insert into public.user_settings (user_id, preferred_language, created_at, updated_at)
  values (NEW.id, _locale, now(), now())
  on conflict (user_id) do update
  set preferred_language = excluded.preferred_language, updated_at = now();
  return NEW;
end;
$$;


ALTER FUNCTION "public"."init_user_language"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_credit_pack_purchase"("p_user_id" "uuid", "p_payment_intent_id" "text", "p_price_id" "text", "p_credits" integer, "p_amount_paid" integer, "p_expires_at" timestamp with time zone, "p_description" "text", "p_metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check for duplicate processing (idempotency)
  IF EXISTS (
    SELECT 1 FROM credit_pack_purchases 
    WHERE stripe_payment_intent_id = p_payment_intent_id
  ) THEN
    RAISE NOTICE 'Credit pack purchase already processed: %', p_payment_intent_id;
    RETURN;
  END IF;
  
  -- Record purchase
  INSERT INTO credit_pack_purchases (
    user_id, stripe_payment_intent_id, stripe_price_id,
    credits_purchased, amount_paid, status, expires_at
  ) VALUES (
    p_user_id, p_payment_intent_id, p_price_id,
    p_credits, p_amount_paid, 'completed', p_expires_at
  );
  
  -- Award credits atomically
  INSERT INTO user_credits (
    user_id, credits, transaction_type, source_type,
    source_id, expires_at, description, metadata
  ) VALUES (
    p_user_id, p_credits, 'earned', 'credit_pack',
    p_payment_intent_id, p_expires_at, p_description, p_metadata
  );
END;
$$;


ALTER FUNCTION "public"."process_credit_pack_purchase"("p_user_id" "uuid", "p_payment_intent_id" "text", "p_price_id" "text", "p_credits" integer, "p_amount_paid" integer, "p_expires_at" timestamp with time zone, "p_description" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refund_credits_with_idempotency"("p_user_id" "uuid", "p_job_id" "uuid", "p_amount" integer, "p_reason" "text", "p_idempotency_key" "text") RETURNS TABLE("success" boolean, "refund_created" boolean, "error_message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    existing_refund_count INTEGER;
BEGIN
    -- Check if refund already exists with this idempotency key
    SELECT COUNT(*) INTO existing_refund_count
    FROM user_credits 
    WHERE user_id = p_user_id 
      AND source_type = 'refund'
      AND source_id = p_job_id::TEXT
      AND metadata->>'idempotency_key' = p_idempotency_key;
    
    -- If refund already exists, return success but indicate no new refund created
    IF existing_refund_count > 0 THEN
        RETURN QUERY SELECT TRUE, FALSE, 'Refund already processed'::TEXT;
        RETURN;
    END IF;
    
    -- Create new refund record
    INSERT INTO user_credits (
        user_id,
        credits,
        transaction_type,
        source_type,
        source_id,
        description,
        metadata
    ) VALUES (
        p_user_id,
        p_amount,
        'earned',
        'refund',
        p_job_id::TEXT,
        p_reason,
        jsonb_build_object(
            'original_job_id', p_job_id,
            'reason', 'job_creation_failed',
            'idempotency_key', p_idempotency_key
        )
    );
    
    RETURN QUERY SELECT TRUE, TRUE, NULL::TEXT;
    
EXCEPTION WHEN unique_violation THEN
    -- Handle race condition where another process created the same refund
    RETURN QUERY SELECT TRUE, FALSE, 'Concurrent refund already processed'::TEXT;
WHEN OTHERS THEN
    RAISE LOG 'refund_credits_with_idempotency error for user % job %: %', p_user_id, p_job_id, SQLERRM;
    RETURN QUERY SELECT FALSE, FALSE, SQLERRM;
END;
$$;


ALTER FUNCTION "public"."refund_credits_with_idempotency"("p_user_id" "uuid", "p_job_id" "uuid", "p_amount" integer, "p_reason" "text", "p_idempotency_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_welcome_email_after_signup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  _project_ref text;
  _hook_secret text;
  _url text;
  _headers jsonb;
  _full_name text;
  _locale text;
begin
  select c.project_ref, c.welcome_hook_secret
  into _project_ref, _hook_secret
  from app.config c
  where c.id = 1;

  if coalesce(_project_ref, '') = '' or coalesce(_hook_secret, '') = '' then
    return NEW;
  end if;

  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NULLIF(CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'given_name', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'family_name', '')
    ), ' '),
    NEW.raw_user_meta_data->>'user_name'
  );

  _locale := coalesce(NEW.raw_user_meta_data->>'locale', 'en-GB');

  _url := 'https://' || _project_ref || '.functions.supabase.co/send-welcome-email';
  _headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-hook-secret', _hook_secret
  );

  perform net.http_post(
    url := _url,
    headers := _headers,
    body := jsonb_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'full_name', _full_name,
      'locale', _locale
    )
  );

  return NEW;
end;
$$;


ALTER FUNCTION "public"."send_welcome_email_after_signup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_language"("new_language" character varying) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.user_settings (user_id, preferred_language, created_at, updated_at)
  values (auth.uid(), new_language, now(), now())
  on conflict (user_id) do update set
    preferred_language = excluded.preferred_language,
    updated_at = now();
end;
$$;


ALTER FUNCTION "public"."set_user_language"("new_language" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."should_cleanup_stuck_inference_jobs"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.inference_jobs 
    WHERE status = 'running' 
      AND updated_at < (now() - interval '15 minutes')
  );
$$;


ALTER FUNCTION "public"."should_cleanup_stuck_inference_jobs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."should_trigger_inference_queue"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
WITH heads AS (
  SELECT user_id
  FROM public.inference_jobs
  WHERE status = 'queued'
    AND (retry_after IS NULL OR retry_after <= now())
  GROUP BY user_id
),
active AS (
  SELECT user_id, COUNT(*) AS active
  FROM public.inference_jobs
  WHERE status IN ('initializing','pending','running')
  GROUP BY user_id
),
limits AS (
  SELECT us.user_id, COALESCE(s.concurrent_jobs, 1) AS lim
  FROM public.user_subscriptions us
  JOIN public.subscriptions s ON s.name = us.plan_name
  WHERE us.status = 'active'
)
SELECT EXISTS (
  SELECT 1
  FROM heads h
  JOIN limits l ON l.user_id = h.user_id
  LEFT JOIN active a ON a.user_id = h.user_id
  WHERE COALESCE(a.active, 0) < l.lim
);
$$;


ALTER FUNCTION "public"."should_trigger_inference_queue"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."should_trigger_training_queue"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
WITH heads AS (
  SELECT user_id
  FROM public.training_jobs
  WHERE status = 'queued'
    AND (retry_after IS NULL OR retry_after <= now())
  GROUP BY user_id
),
active AS (
  SELECT user_id, COUNT(*) AS active
  FROM public.training_jobs
  WHERE status IN ('initializing','pending','running')
  GROUP BY user_id
),
limits AS (
  SELECT us.user_id, COALESCE(s.concurrent_trainings, 1) AS lim
  FROM public.user_subscriptions us
  JOIN public.subscriptions s ON s.name = us.plan_name
  WHERE us.status = 'active'
)
SELECT EXISTS (
  SELECT 1
  FROM heads h
  JOIN limits l ON l.user_id = h.user_id
  LEFT JOIN active a ON a.user_id = h.user_id
  WHERE COALESCE(a.active, 0) < l.lim
);
$$;


ALTER FUNCTION "public"."should_trigger_training_queue"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."spend_credits_with_job_tracking"("p_user_id" "uuid", "p_job_id" "uuid", "p_amount" integer, "p_usage_type" "text", "p_description" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("success" boolean, "current_balance" integer, "error_message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    initial_balance INTEGER;
    final_balance INTEGER;
    spend_success BOOLEAN;
BEGIN
    -- Start transaction (function is automatically wrapped in transaction)
    
    -- Get initial balance
    SELECT get_user_credit_balance(p_user_id) INTO initial_balance;
    
    -- Check if user has enough credits
    IF initial_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, initial_balance, 'Insufficient credits'::TEXT;
        RETURN;
    END IF;
    
    -- Attempt to spend credits using existing function
    SELECT spend_user_credits(
        p_user_id,
        p_amount,
        p_usage_type,
        p_description,
        p_metadata || jsonb_build_object('job_id', p_job_id)
    ) INTO spend_success;
    
    IF NOT spend_success THEN
        RETURN QUERY SELECT FALSE, initial_balance, 'Failed to spend credits'::TEXT;
        RETURN;
    END IF;
    
    -- Get final balance
    SELECT get_user_credit_balance(p_user_id) INTO final_balance;
    
    -- Return success
    RETURN QUERY SELECT TRUE, final_balance, NULL::TEXT;
    
EXCEPTION WHEN OTHERS THEN
    -- Log error and return failure
    RAISE LOG 'spend_credits_with_job_tracking error for user % job %: %', p_user_id, p_job_id, SQLERRM;
    RETURN QUERY SELECT FALSE, COALESCE(initial_balance, 0), SQLERRM;
END;
$$;


ALTER FUNCTION "public"."spend_credits_with_job_tracking"("p_user_id" "uuid", "p_job_id" "uuid", "p_amount" integer, "p_usage_type" "text", "p_description" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."spend_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_usage_type" "text", "p_description" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("success" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_quality text := NULL;
  v_nb_takes int := NULL;
  v_job_id uuid := NULL;
BEGIN
  v_quality := NULLIF(p_metadata->>'quality','');
  v_nb_takes := NULLIF(p_metadata->>'nb_takes','')::int;
  v_job_id := NULLIF(p_metadata->>'job_id','')::uuid;

  INSERT INTO public.user_credits (
    user_id, credits, transaction_type, source_type, source_id, description, metadata
  ) VALUES (
    p_user_id, p_amount, 'spent', 'inference', NULL, COALESCE(p_description, p_usage_type), COALESCE(p_metadata, '{}'::jsonb)
  );

  INSERT INTO public.credit_usage (
    user_id, credits_used, usage_type, quality, nb_takes, job_id, metadata
  ) VALUES (
    p_user_id, p_amount, p_usage_type, v_quality, v_nb_takes, v_job_id, COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN QUERY SELECT TRUE;
END;
$$;


ALTER FUNCTION "public"."spend_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_usage_type" "text", "p_description" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."training_jobs_status_timestamps"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Set started_at only on transition into 'running' if not already set
  if (new.status = 'running'
      and (old.status is distinct from 'running')
      and new.started_at is null) then
    new.started_at := now();
  end if;

  -- Set completed_at only on first transition into a terminal state
  if ((new.status = 'completed' or new.status = 'failed')
      and (old.status is distinct from new.status)
      and new.completed_at is null) then
    new.completed_at := now();
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."training_jobs_status_timestamps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_language_preference"("new_language" character varying) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO public.user_language_preferences (user_id, preferred_language)
    VALUES (auth.uid(), new_language)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        preferred_language = EXCLUDED.preferred_language,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."update_language_preference"("new_language" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_subscription"("p_user_id" "uuid", "p_stripe_subscription_id" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_plan_name" "text", "p_status" "text", "p_current_period_start" timestamp with time zone, "p_current_period_end" timestamp with time zone, "p_cancel_at_period_end" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO user_subscriptions (
    user_id, stripe_subscription_id, stripe_customer_id,
    stripe_price_id, plan_name, status, current_period_start,
    current_period_end, cancel_at_period_end, updated_at
  ) VALUES (
    p_user_id, p_stripe_subscription_id, p_stripe_customer_id,
    p_stripe_price_id, p_plan_name, p_status, p_current_period_start,
    p_current_period_end, p_cancel_at_period_end, now()
  )
  ON CONFLICT (stripe_subscription_id) 
  DO UPDATE SET
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_price_id = EXCLUDED.stripe_price_id,
    plan_name = EXCLUDED.plan_name,
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    updated_at = now();
END;
$$;


ALTER FUNCTION "public"."upsert_subscription"("p_user_id" "uuid", "p_stripe_subscription_id" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_plan_name" "text", "p_status" "text", "p_current_period_start" timestamp with time zone, "p_current_period_end" timestamp with time zone, "p_cancel_at_period_end" boolean) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "app"."config" (
    "id" integer DEFAULT 1 NOT NULL,
    "project_ref" "text" NOT NULL,
    "welcome_hook_secret" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "app"."config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."characters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "thumbnail_url" "text",
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "image_count" integer DEFAULT 0,
    "gender" "text",
    "eye_color" "text",
    "hair_color" "text",
    "hair_length" "text",
    "hair_style" "text",
    "age" "text",
    "body_type" "text",
    "glasses" "text",
    "metadata" "jsonb",
    "lora_path" "text",
    CONSTRAINT "characters_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'training'::"text", 'ready'::"text", 'failed'::"text", 'deleted'::"text"]))),
    CONSTRAINT "chk_characters_image_count_positive" CHECK (("image_count" >= 0)),
    CONSTRAINT "face_models_gender_check" CHECK ((("gender" = ANY (ARRAY['Male'::"text", 'Female'::"text", 'male'::"text", 'female'::"text", 'MALE'::"text", 'FEMALE'::"text"])) OR ("gender" IS NULL)))
);


ALTER TABLE "public"."characters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_costs" (
    "id" integer NOT NULL,
    "type" "text" NOT NULL,
    "value" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."credit_costs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."credit_costs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."credit_costs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."credit_costs_id_seq" OWNED BY "public"."credit_costs"."id";



CREATE TABLE IF NOT EXISTS "public"."credit_pack_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_payment_intent_id" "text" NOT NULL,
    "stripe_price_id" "text" NOT NULL,
    "credits_purchased" integer NOT NULL,
    "amount_paid" integer NOT NULL,
    "status" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "credit_pack_purchases_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text"])))
);

ALTER TABLE ONLY "public"."credit_pack_purchases" REPLICA IDENTITY FULL;


ALTER TABLE "public"."credit_pack_purchases" OWNER TO "postgres";


COMMENT ON TABLE "public"."credit_pack_purchases" IS 'Real-time enabled for credit pack purchase tracking';



CREATE TABLE IF NOT EXISTS "public"."credit_packs" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "credits" integer NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "validity_days" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "translations" "jsonb" DEFAULT '{}'::"jsonb",
    "image_url" "text"
);


ALTER TABLE "public"."credit_packs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."credit_packs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."credit_packs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."credit_packs_id_seq" OWNED BY "public"."credit_packs"."id";



CREATE TABLE IF NOT EXISTS "public"."credit_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "credits_used" integer NOT NULL,
    "usage_type" "text" NOT NULL,
    "quality" "text",
    "nb_takes" integer,
    "job_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "credit_usage_usage_type_check" CHECK (("usage_type" = ANY (ARRAY['image_generation'::"text", 'character_training'::"text"])))
);

ALTER TABLE ONLY "public"."credit_usage" REPLICA IDENTITY FULL;


ALTER TABLE "public"."credit_usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."credit_usage" IS 'Real-time enabled for credit usage tracking';



CREATE TABLE IF NOT EXISTS "public"."generated_images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "inference_id" "uuid" NOT NULL,
    "original_path" "text" NOT NULL,
    "web_path" "text" NOT NULL,
    "width" integer NOT NULL,
    "height" integer NOT NULL,
    "format" "text" NOT NULL,
    "bytes" bigint NOT NULL,
    "favourite" boolean DEFAULT false NOT NULL,
    "seed" bigint,
    "image_index" integer,
    CONSTRAINT "generated_images_bytes_nonnegative" CHECK (("bytes" >= 0)),
    CONSTRAINT "generated_images_height_positive" CHECK (("height" > 0)),
    CONSTRAINT "generated_images_width_positive" CHECK (("width" > 0))
);


ALTER TABLE "public"."generated_images" OWNER TO "postgres";


COMMENT ON COLUMN "public"."generated_images"."seed" IS 'The seed value used to generate this image for reproducibility';



CREATE TABLE IF NOT EXISTS "public"."inference_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."inference_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "expires_at" timestamp with time zone,
    "last_accessed_at" timestamp with time zone
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."style_colors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" "text" NOT NULL,
    "label" "text" NOT NULL,
    "color" "text" NOT NULL,
    "translations" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "style_colors_color_check" CHECK (("color" ~ '^#[0-9A-Fa-f]{6}$'::"text"))
);


ALTER TABLE "public"."style_colors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."style_scenes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" "text" NOT NULL,
    "label" "text" NOT NULL,
    "image" "text" NOT NULL,
    "translations" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "prompt" "text",
    "atmosphere" "text"
);


ALTER TABLE "public"."style_scenes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."style_scenes"."atmosphere" IS 'Optional atmosphere description that can be used in style prompts via [atmosphere] placeholder';



CREATE TABLE IF NOT EXISTS "public"."style_wardrobes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "value" "text" NOT NULL,
    "label" "text" NOT NULL,
    "image" "text" NOT NULL,
    "translations" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "gender" "text" DEFAULT 'unisex'::"text" NOT NULL,
    "prompt" "text",
    "category" "text" NOT NULL,
    CONSTRAINT "chk_style_wardrobes_gender" CHECK (("gender" = ANY (ARRAY['man'::"text", 'woman'::"text", 'unisex'::"text"])))
);


ALTER TABLE "public"."style_wardrobes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."styles" (
    "name" "text" NOT NULL,
    "preview_images" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "available_scenes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "available_wardrobes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "available_colors" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "translations" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "prompt" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lora_path" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "wardrobe_category_order" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "wardrobe_order" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."styles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."styles"."settings" IS 'Per-style ComfyUI node overrides keyed by node title. Example: {"FilmGrain": {"grain_intensity": 0.1}, "CharacterLoRA": {"strength_model": 0.8}}';



COMMENT ON COLUMN "public"."styles"."wardrobe_category_order" IS 'Preferred category display order for this style (e.g., ["Professional","Smart Casual"]).';



COMMENT ON COLUMN "public"."styles"."wardrobe_order" IS 'Per-category wardrobe ordering map, e.g. {"Professional":["suit","blazer"],"Smart Casual":["polo","tshirt"]}. Keys are categories from style_wardrobes.category. Values are wardrobe "value" ids.';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "original_price" numeric(10,2) NOT NULL,
    "monthly_price" numeric(10,2) NOT NULL,
    "yearly_price" numeric(10,2) NOT NULL,
    "credits" integer NOT NULL,
    "max_quality" "text" NOT NULL,
    "character_training_included" integer NOT NULL,
    "concurrent_jobs" integer NOT NULL,
    "max_characters" integer NOT NULL,
    "features" "jsonb",
    "popular" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "translations" "jsonb" DEFAULT '{}'::"jsonb",
    "concurrent_trainings" integer,
    "queue_type" "text" DEFAULT 'fast'::"text" NOT NULL,
    "disabled" boolean DEFAULT false NOT NULL,
    "image_url" "text",
    CONSTRAINT "subscriptions_queue_type_check" CHECK (("queue_type" = ANY (ARRAY['fast'::"text", 'slow'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."subscriptions"."disabled" IS 'Whether this subscription tier is disabled and should not be available for new subscriptions';



CREATE SEQUENCE IF NOT EXISTS "public"."subscriptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."subscriptions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."subscriptions_id_seq" OWNED BY "public"."subscriptions"."id";



CREATE TABLE IF NOT EXISTS "public"."uploaded_images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "file_name" "text",
    "file_size" bigint,
    "mime_type" "text",
    "dimensions" "jsonb",
    "quality_score" double precision DEFAULT 0,
    "character_id" "uuid"
);


ALTER TABLE "public"."uploaded_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_credits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "credits" integer NOT NULL,
    "transaction_type" "text" NOT NULL,
    "source_type" "text" NOT NULL,
    "source_id" "text",
    "expires_at" timestamp with time zone,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_credits_source_type_check" CHECK (("source_type" = ANY (ARRAY['subscription'::"text", 'credit_pack'::"text", 'refund'::"text", 'admin'::"text", 'inference'::"text"]))),
    CONSTRAINT "user_credits_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['earned'::"text", 'spent'::"text", 'expired'::"text", 'refunded'::"text"])))
);

ALTER TABLE ONLY "public"."user_credits" REPLICA IDENTITY FULL;


ALTER TABLE "public"."user_credits" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_credits" IS 'Real-time enabled for credit balance updates';



CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "user_id" "uuid" NOT NULL,
    "preferred_language" character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_subscription_id" "text" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "stripe_price_id" "text" NOT NULL,
    "plan_name" "text" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'canceled'::"text", 'incomplete'::"text", 'incomplete_expired'::"text", 'past_due'::"text", 'unpaid'::"text", 'paused'::"text"])))
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "admin" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" bigint NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."waitlist" OWNER TO "postgres";


ALTER TABLE "public"."waitlist" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."waitlist_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."credit_costs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."credit_costs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."credit_packs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."credit_packs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."subscriptions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."subscriptions_id_seq"'::"regclass");



ALTER TABLE ONLY "app"."config"
    ADD CONSTRAINT "config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_costs"
    ADD CONSTRAINT "credit_costs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_pack_purchases"
    ADD CONSTRAINT "credit_pack_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_packs"
    ADD CONSTRAINT "credit_packs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_usage"
    ADD CONSTRAINT "credit_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "face_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generated_images"
    ADD CONSTRAINT "generated_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inference_jobs"
    ADD CONSTRAINT "inference_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inference_settings"
    ADD CONSTRAINT "inference_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."style_colors"
    ADD CONSTRAINT "style_colors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."style_colors"
    ADD CONSTRAINT "style_colors_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."style_scenes"
    ADD CONSTRAINT "style_scenes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."style_scenes"
    ADD CONSTRAINT "style_scenes_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."style_wardrobes"
    ADD CONSTRAINT "style_wardrobes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."style_wardrobes"
    ADD CONSTRAINT "style_wardrobes_value_key" UNIQUE ("value");



ALTER TABLE ONLY "public"."styles"
    ADD CONSTRAINT "styles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_jobs"
    ADD CONSTRAINT "training_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."uploaded_images"
    ADD CONSTRAINT "uploaded_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_language_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_characters_metadata" ON "public"."characters" USING "gin" ("metadata");



CREATE INDEX "idx_credit_pack_purchases_payment_intent_id" ON "public"."credit_pack_purchases" USING "btree" ("stripe_payment_intent_id");



CREATE INDEX "idx_credit_pack_purchases_status" ON "public"."credit_pack_purchases" USING "btree" ("status");



CREATE INDEX "idx_credit_pack_purchases_stripe_id" ON "public"."credit_pack_purchases" USING "btree" ("stripe_payment_intent_id");



CREATE INDEX "idx_credit_pack_purchases_stripe_payment_intent_id" ON "public"."credit_pack_purchases" USING "btree" ("stripe_payment_intent_id");



CREATE INDEX "idx_credit_pack_purchases_user_id" ON "public"."credit_pack_purchases" USING "btree" ("user_id");



CREATE INDEX "idx_credit_usage_created_at" ON "public"."credit_usage" USING "btree" ("created_at");



CREATE INDEX "idx_credit_usage_usage_type" ON "public"."credit_usage" USING "btree" ("usage_type");



CREATE INDEX "idx_credit_usage_user_id" ON "public"."credit_usage" USING "btree" ("user_id");



CREATE INDEX "idx_face_models_created_at" ON "public"."characters" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_face_models_image_count" ON "public"."characters" USING "btree" ("image_count");



CREATE INDEX "idx_face_models_status" ON "public"."characters" USING "btree" ("status");



CREATE INDEX "idx_face_models_user_id" ON "public"."characters" USING "btree" ("user_id");



CREATE INDEX "idx_generated_images_inference_id" ON "public"."generated_images" USING "btree" ("inference_id");



CREATE INDEX "idx_generated_images_seed" ON "public"."generated_images" USING "btree" ("seed");



CREATE INDEX "idx_generated_images_user_id" ON "public"."generated_images" USING "btree" ("user_id");



CREATE INDEX "idx_inference_jobs_character_id" ON "public"."inference_jobs" USING "btree" ("character_id");



CREATE INDEX "idx_inference_jobs_color_id" ON "public"."inference_jobs" USING "btree" ("color_id");



CREATE INDEX "idx_inference_jobs_created_at" ON "public"."inference_jobs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_inference_jobs_scene_id" ON "public"."inference_jobs" USING "btree" ("scene_id");



CREATE INDEX "idx_inference_jobs_status" ON "public"."inference_jobs" USING "btree" ("status");



CREATE INDEX "idx_inference_jobs_style_id" ON "public"."inference_jobs" USING "btree" ("style_id");



CREATE INDEX "idx_inference_jobs_user_id" ON "public"."inference_jobs" USING "btree" ("user_id");



CREATE INDEX "idx_inference_jobs_wardrobe_id" ON "public"."inference_jobs" USING "btree" ("wardrobe_id");



CREATE INDEX "idx_style_colors_translations" ON "public"."style_colors" USING "gin" ("translations");



CREATE INDEX "idx_style_colors_value" ON "public"."style_colors" USING "btree" ("value");



CREATE INDEX "idx_style_scenes_translations" ON "public"."style_scenes" USING "gin" ("translations");



CREATE INDEX "idx_style_scenes_value" ON "public"."style_scenes" USING "btree" ("value");



CREATE INDEX "idx_style_wardrobes_gender" ON "public"."style_wardrobes" USING "btree" ("gender");



CREATE INDEX "idx_style_wardrobes_translations" ON "public"."style_wardrobes" USING "gin" ("translations");



CREATE INDEX "idx_style_wardrobes_value" ON "public"."style_wardrobes" USING "btree" ("value");



CREATE INDEX "idx_subscriptions_disabled" ON "public"."subscriptions" USING "btree" ("disabled");



CREATE INDEX "idx_training_jobs_character_id" ON "public"."training_jobs" USING "btree" ("character_id");



CREATE INDEX "idx_training_jobs_created_at" ON "public"."training_jobs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_training_jobs_queued_retry_after" ON "public"."training_jobs" USING "btree" ("retry_after") WHERE ("status" = 'queued'::"text");



CREATE INDEX "idx_training_jobs_status" ON "public"."training_jobs" USING "btree" ("status");



CREATE INDEX "idx_training_jobs_user_id" ON "public"."training_jobs" USING "btree" ("user_id");



CREATE INDEX "idx_uploaded_images_character_id" ON "public"."uploaded_images" USING "btree" ("character_id");



CREATE INDEX "idx_user_credits_expires_at" ON "public"."user_credits" USING "btree" ("expires_at");



CREATE UNIQUE INDEX "idx_user_credits_refund_idempotency" ON "public"."user_credits" USING "btree" ("user_id", "source_type", "source_id", (("metadata" ->> 'idempotency_key'::"text"))) WHERE (("source_type" = 'refund'::"text") AND (("metadata" ->> 'idempotency_key'::"text") IS NOT NULL));



CREATE INDEX "idx_user_credits_source" ON "public"."user_credits" USING "btree" ("source_type", "source_id");



CREATE INDEX "idx_user_credits_source_type" ON "public"."user_credits" USING "btree" ("source_type");



CREATE INDEX "idx_user_credits_transaction_type" ON "public"."user_credits" USING "btree" ("transaction_type");



CREATE INDEX "idx_user_credits_user_id" ON "public"."user_credits" USING "btree" ("user_id");



CREATE INDEX "idx_user_subscriptions_status" ON "public"."user_subscriptions" USING "btree" ("status");



CREATE INDEX "idx_user_subscriptions_stripe_id" ON "public"."user_subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_user_subscriptions_stripe_subscription_id" ON "public"."user_subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_user_subscriptions_user_id" ON "public"."user_subscriptions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "uniq_generated_images_inference_image_index" ON "public"."generated_images" USING "btree" ("inference_id", "image_index");



COMMENT ON INDEX "public"."uniq_generated_images_inference_image_index" IS 'Prevents duplicate rows for the same job image (inference_id,image_index).';



CREATE OR REPLACE TRIGGER "trg_inference_settings_updated" BEFORE UPDATE ON "public"."inference_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_training_jobs_status_timestamps" BEFORE UPDATE ON "public"."training_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."training_jobs_status_timestamps"();



CREATE OR REPLACE TRIGGER "update_face_models_updated_at" BEFORE UPDATE ON "public"."characters" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_inference_jobs_updated_at" BEFORE UPDATE ON "public"."inference_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sessions_updated_at" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_style_colors_updated_at" BEFORE UPDATE ON "public"."style_colors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_style_scenes_updated_at" BEFORE UPDATE ON "public"."style_scenes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_style_wardrobes_updated_at" BEFORE UPDATE ON "public"."style_wardrobes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_styles_updated_at" BEFORE UPDATE ON "public"."styles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_training_jobs_updated_at" BEFORE UPDATE ON "public"."training_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_subscriptions_updated_at" BEFORE UPDATE ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."credit_pack_purchases"
    ADD CONSTRAINT "credit_pack_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_usage"
    ADD CONSTRAINT "credit_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "face_models_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."uploaded_images"
    ADD CONSTRAINT "fk_uploaded_images_character_id" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."generated_images"
    ADD CONSTRAINT "generated_images_inference_id_fkey" FOREIGN KEY ("inference_id") REFERENCES "public"."inference_jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_images"
    ADD CONSTRAINT "generated_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inference_jobs"
    ADD CONSTRAINT "inference_jobs_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inference_jobs"
    ADD CONSTRAINT "inference_jobs_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "public"."style_colors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inference_jobs"
    ADD CONSTRAINT "inference_jobs_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "public"."style_scenes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inference_jobs"
    ADD CONSTRAINT "inference_jobs_style_id_fkey" FOREIGN KEY ("style_id") REFERENCES "public"."styles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inference_jobs"
    ADD CONSTRAINT "inference_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inference_jobs"
    ADD CONSTRAINT "inference_jobs_wardrobe_id_fkey" FOREIGN KEY ("wardrobe_id") REFERENCES "public"."style_wardrobes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_jobs"
    ADD CONSTRAINT "training_jobs_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_jobs"
    ADD CONSTRAINT "training_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."uploaded_images"
    ADD CONSTRAINT "uploaded_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_language_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete inference_settings" ON "public"."inference_settings" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Admins can delete style_colors" ON "public"."style_colors" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Admins can delete style_scenes" ON "public"."style_scenes" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Admins can delete style_wardrobes" ON "public"."style_wardrobes" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Admins can delete styles" ON "public"."styles" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Admins can insert inference_settings" ON "public"."inference_settings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Admins can insert style_colors" ON "public"."style_colors" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Admins can insert style_scenes" ON "public"."style_scenes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Admins can insert style_wardrobes" ON "public"."style_wardrobes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Admins can insert styles" ON "public"."styles" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Admins can read styles" ON "public"."styles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Admins can read waitlist" ON "public"."waitlist" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."admin" = true)))));



CREATE POLICY "Admins can update inference_settings" ON "public"."inference_settings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Admins can update style_colors" ON "public"."style_colors" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Admins can update style_scenes" ON "public"."style_scenes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Admins can update style_wardrobes" ON "public"."style_wardrobes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Admins can update styles" ON "public"."styles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."admin" = true)))));



CREATE POLICY "Allow insert during signup" ON "public"."users" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Allow public insert" ON "public"."waitlist" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read access to inference_settings" ON "public"."inference_settings" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to style_colors" ON "public"."style_colors" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow public read access to style_scenes" ON "public"."style_scenes" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow public read access to style_wardrobes" ON "public"."style_wardrobes" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow public read access to styles" ON "public"."styles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read credit_costs" ON "public"."credit_costs" FOR SELECT USING (true);



CREATE POLICY "Anyone can read credit_packs" ON "public"."credit_packs" FOR SELECT USING (true);



CREATE POLICY "Anyone can read subscriptions" ON "public"."subscriptions" FOR SELECT USING (true);



CREATE POLICY "Only service_role can delete credit_costs" ON "public"."credit_costs" FOR DELETE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Only service_role can delete credit_packs" ON "public"."credit_packs" FOR DELETE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Only service_role can delete subscriptions" ON "public"."subscriptions" FOR DELETE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Only service_role can insert credit_costs" ON "public"."credit_costs" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Only service_role can insert credit_packs" ON "public"."credit_packs" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Only service_role can insert subscriptions" ON "public"."subscriptions" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Only service_role can update credit_costs" ON "public"."credit_costs" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Only service_role can update credit_packs" ON "public"."credit_packs" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Only service_role can update subscriptions" ON "public"."subscriptions" FOR UPDATE USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Public read access" ON "public"."styles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Select own credit pack purchases" ON "public"."credit_pack_purchases" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Select own credits" ON "public"."user_credits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Select own subscription" ON "public"."user_subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Service role can manage credit usage" ON "public"."credit_usage" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to credit_pack_purchases" ON "public"."credit_pack_purchases" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to user_credits" ON "public"."user_credits" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to user_subscriptions" ON "public"."user_subscriptions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to users" ON "public"."users" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create their own face models" ON "public"."characters" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own inference jobs" ON "public"."inference_jobs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own training jobs" ON "public"."training_jobs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own face models" ON "public"."characters" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own inference jobs" ON "public"."inference_jobs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own sessions" ON "public"."sessions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own training jobs" ON "public"."training_jobs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own credit pack purchases" ON "public"."credit_pack_purchases" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own credit usage" ON "public"."credit_usage" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own credits" ON "public"."user_credits" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own subscriptions" ON "public"."user_subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own sessions" ON "public"."sessions" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own settings" ON "public"."user_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own uploaded images" ON "public"."uploaded_images" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own settings" ON "public"."user_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own face models" ON "public"."characters" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own inference jobs" ON "public"."inference_jobs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile (except admin)" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK ((("auth"."uid"() = "id") AND ("admin" = ( SELECT "users_1"."admin"
   FROM "public"."users" "users_1"
  WHERE ("users_1"."id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own settings" ON "public"."user_settings" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own subscriptions" ON "public"."user_subscriptions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own training jobs" ON "public"."training_jobs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view credit_costs" ON "public"."credit_costs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view credit_packs" ON "public"."credit_packs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view style_colors" ON "public"."style_colors" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view style_scenes" ON "public"."style_scenes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view style_wardrobes" ON "public"."style_wardrobes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view styles" ON "public"."styles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view subscriptions" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view their own credit pack purchases" ON "public"."credit_pack_purchases" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own credit usage" ON "public"."credit_usage" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own credits" ON "public"."user_credits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own face models" ON "public"."characters" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own inference jobs" ON "public"."inference_jobs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own sessions" ON "public"."sessions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own subscriptions" ON "public"."user_subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own training jobs" ON "public"."training_jobs" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."characters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_costs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_pack_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_packs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generated_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inference_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inference_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_bypass_policy" ON "public"."generated_images" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."style_colors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."style_scenes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."style_wardrobes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."styles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."uploaded_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_credits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_can_delete_own_images" ON "public"."generated_images" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



COMMENT ON POLICY "users_can_delete_own_images" ON "public"."generated_images" IS 'Allows authenticated users to delete their own generated images';



CREATE POLICY "users_can_insert_own_images" ON "public"."generated_images" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_can_read_own_images" ON "public"."generated_images" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_can_update_own_images" ON "public"."generated_images" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."credit_pack_purchases";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."credit_usage";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."inference_jobs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."subscriptions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."training_jobs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_credits";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_subscriptions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."users";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."waitlist";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




























































































































































GRANT ALL ON FUNCTION "public"."array_distinct"("arr" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."array_distinct"("arr" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_distinct"("arr" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_distinct"("arr" "anyarray") TO "anon";
GRANT ALL ON FUNCTION "public"."array_distinct"("arr" "anyarray") TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_distinct"("arr" "anyarray") TO "service_role";



GRANT ALL ON FUNCTION "public"."award_subscription_credits"("p_user_id" "uuid", "p_subscription_id" "text", "p_credits" integer, "p_expires_at" timestamp with time zone, "p_period_start" timestamp with time zone, "p_period_end" timestamp with time zone, "p_description" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."award_subscription_credits"("p_user_id" "uuid", "p_subscription_id" "text", "p_credits" integer, "p_expires_at" timestamp with time zone, "p_period_start" timestamp with time zone, "p_period_end" timestamp with time zone, "p_description" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_subscription_credits"("p_user_id" "uuid", "p_subscription_id" "text", "p_credits" integer, "p_expires_at" timestamp with time zone, "p_period_start" timestamp with time zone, "p_period_end" timestamp with time zone, "p_description" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_user_credit_balance"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_user_credit_balance"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_user_credit_balance"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."inference_jobs" TO "anon";
GRANT ALL ON TABLE "public"."inference_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."inference_jobs" TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_next_queued_inference_job"() TO "anon";
GRANT ALL ON FUNCTION "public"."claim_next_queued_inference_job"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_next_queued_inference_job"() TO "service_role";



GRANT ALL ON TABLE "public"."training_jobs" TO "anon";
GRANT ALL ON TABLE "public"."training_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."training_jobs" TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_next_queued_training_job"() TO "anon";
GRANT ALL ON FUNCTION "public"."claim_next_queued_training_job"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_next_queued_training_job"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_stuck_inference_jobs"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_stuck_inference_jobs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_stuck_inference_jobs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_credit_pack_credits"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_credit_pack_credits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_credit_pack_credits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_credits"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_credits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_credits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_subscription_credits"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_subscription_credits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_subscription_credits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."force_cleanup_upload_session"("session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."force_cleanup_upload_session"("session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."force_cleanup_upload_session"("session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_style_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_style_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_style_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_training_jobs"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_training_jobs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_training_jobs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_language_preference"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_language_preference"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_language_preference"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pricing_last_updated"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_pricing_last_updated"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pricing_last_updated"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_revenue_data"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_revenue_data"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_revenue_data"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_users_by_generations"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_users_by_generations"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_users_by_generations"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_uploaded_image_counts"("character_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_uploaded_image_counts"("character_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_uploaded_image_counts"("character_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_available_credits"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_available_credits"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_available_credits"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_credit_balance"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_credit_balance"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_credit_balance"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_language"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_language"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_language"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_image_count"("character_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_image_count"("character_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_image_count"("character_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."init_user_language"() TO "anon";
GRANT ALL ON FUNCTION "public"."init_user_language"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."init_user_language"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_credit_pack_purchase"("p_user_id" "uuid", "p_payment_intent_id" "text", "p_price_id" "text", "p_credits" integer, "p_amount_paid" integer, "p_expires_at" timestamp with time zone, "p_description" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_credit_pack_purchase"("p_user_id" "uuid", "p_payment_intent_id" "text", "p_price_id" "text", "p_credits" integer, "p_amount_paid" integer, "p_expires_at" timestamp with time zone, "p_description" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_credit_pack_purchase"("p_user_id" "uuid", "p_payment_intent_id" "text", "p_price_id" "text", "p_credits" integer, "p_amount_paid" integer, "p_expires_at" timestamp with time zone, "p_description" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."refund_credits_with_idempotency"("p_user_id" "uuid", "p_job_id" "uuid", "p_amount" integer, "p_reason" "text", "p_idempotency_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."refund_credits_with_idempotency"("p_user_id" "uuid", "p_job_id" "uuid", "p_amount" integer, "p_reason" "text", "p_idempotency_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refund_credits_with_idempotency"("p_user_id" "uuid", "p_job_id" "uuid", "p_amount" integer, "p_reason" "text", "p_idempotency_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_welcome_email_after_signup"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_welcome_email_after_signup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_welcome_email_after_signup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_language"("new_language" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_language"("new_language" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_language"("new_language" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."should_cleanup_stuck_inference_jobs"() TO "anon";
GRANT ALL ON FUNCTION "public"."should_cleanup_stuck_inference_jobs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."should_cleanup_stuck_inference_jobs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."should_trigger_inference_queue"() TO "anon";
GRANT ALL ON FUNCTION "public"."should_trigger_inference_queue"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."should_trigger_inference_queue"() TO "service_role";



GRANT ALL ON FUNCTION "public"."should_trigger_training_queue"() TO "anon";
GRANT ALL ON FUNCTION "public"."should_trigger_training_queue"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."should_trigger_training_queue"() TO "service_role";



GRANT ALL ON FUNCTION "public"."spend_credits_with_job_tracking"("p_user_id" "uuid", "p_job_id" "uuid", "p_amount" integer, "p_usage_type" "text", "p_description" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."spend_credits_with_job_tracking"("p_user_id" "uuid", "p_job_id" "uuid", "p_amount" integer, "p_usage_type" "text", "p_description" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."spend_credits_with_job_tracking"("p_user_id" "uuid", "p_job_id" "uuid", "p_amount" integer, "p_usage_type" "text", "p_description" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."spend_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_usage_type" "text", "p_description" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."spend_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_usage_type" "text", "p_description" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."spend_user_credits"("p_user_id" "uuid", "p_amount" integer, "p_usage_type" "text", "p_description" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."training_jobs_status_timestamps"() TO "anon";
GRANT ALL ON FUNCTION "public"."training_jobs_status_timestamps"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."training_jobs_status_timestamps"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_language_preference"("new_language" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."update_language_preference"("new_language" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_language_preference"("new_language" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_subscription"("p_user_id" "uuid", "p_stripe_subscription_id" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_plan_name" "text", "p_status" "text", "p_current_period_start" timestamp with time zone, "p_current_period_end" timestamp with time zone, "p_cancel_at_period_end" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_subscription"("p_user_id" "uuid", "p_stripe_subscription_id" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_plan_name" "text", "p_status" "text", "p_current_period_start" timestamp with time zone, "p_current_period_end" timestamp with time zone, "p_cancel_at_period_end" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_subscription"("p_user_id" "uuid", "p_stripe_subscription_id" "text", "p_stripe_customer_id" "text", "p_stripe_price_id" "text", "p_plan_name" "text", "p_status" "text", "p_current_period_start" timestamp with time zone, "p_current_period_end" timestamp with time zone, "p_cancel_at_period_end" boolean) TO "service_role";


















GRANT ALL ON TABLE "public"."characters" TO "anon";
GRANT ALL ON TABLE "public"."characters" TO "authenticated";
GRANT ALL ON TABLE "public"."characters" TO "service_role";



GRANT ALL ON TABLE "public"."credit_costs" TO "anon";
GRANT ALL ON TABLE "public"."credit_costs" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_costs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."credit_costs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."credit_costs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."credit_costs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."credit_pack_purchases" TO "anon";
GRANT ALL ON TABLE "public"."credit_pack_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_pack_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."credit_packs" TO "anon";
GRANT ALL ON TABLE "public"."credit_packs" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_packs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."credit_packs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."credit_packs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."credit_packs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."credit_usage" TO "anon";
GRANT ALL ON TABLE "public"."credit_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_usage" TO "service_role";



GRANT ALL ON TABLE "public"."generated_images" TO "anon";
GRANT ALL ON TABLE "public"."generated_images" TO "authenticated";
GRANT ALL ON TABLE "public"."generated_images" TO "service_role";



GRANT ALL ON TABLE "public"."inference_settings" TO "anon";
GRANT ALL ON TABLE "public"."inference_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."inference_settings" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."style_colors" TO "anon";
GRANT ALL ON TABLE "public"."style_colors" TO "authenticated";
GRANT ALL ON TABLE "public"."style_colors" TO "service_role";



GRANT ALL ON TABLE "public"."style_scenes" TO "anon";
GRANT ALL ON TABLE "public"."style_scenes" TO "authenticated";
GRANT ALL ON TABLE "public"."style_scenes" TO "service_role";



GRANT ALL ON TABLE "public"."style_wardrobes" TO "anon";
GRANT ALL ON TABLE "public"."style_wardrobes" TO "authenticated";
GRANT ALL ON TABLE "public"."style_wardrobes" TO "service_role";



GRANT ALL ON TABLE "public"."styles" TO "anon";
GRANT ALL ON TABLE "public"."styles" TO "authenticated";
GRANT ALL ON TABLE "public"."styles" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."subscriptions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."subscriptions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."subscriptions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."uploaded_images" TO "anon";
GRANT ALL ON TABLE "public"."uploaded_images" TO "authenticated";
GRANT ALL ON TABLE "public"."uploaded_images" TO "service_role";



GRANT ALL ON TABLE "public"."user_credits" TO "anon";
GRANT ALL ON TABLE "public"."user_credits" TO "authenticated";
GRANT ALL ON TABLE "public"."user_credits" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist" TO "anon";
GRANT ALL ON TABLE "public"."waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist" TO "service_role";



GRANT ALL ON SEQUENCE "public"."waitlist_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."waitlist_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."waitlist_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
