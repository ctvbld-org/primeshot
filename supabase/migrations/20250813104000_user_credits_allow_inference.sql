-- Allow 'inference' as a valid source_type for user_credits and ensure spend function uses it

-- 1) Relax/check constraint to include 'inference'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'user_credits' AND c.conname = 'user_credits_source_type_check'
  ) THEN
    ALTER TABLE public.user_credits DROP CONSTRAINT user_credits_source_type_check;
  END IF;
END$$;

ALTER TABLE public.user_credits
  ADD CONSTRAINT user_credits_source_type_check
  CHECK (source_type IN ('subscription','credit_pack','refund','admin','inference'));

-- 2) Backfill any temporary 'admin' spent rows to 'inference'
UPDATE public.user_credits
SET source_type = 'inference'
WHERE transaction_type = 'spent' AND source_type = 'admin';

-- 3) Recreate spend_user_credits to write both user_credits and credit_usage (source_type='inference')
DROP FUNCTION IF EXISTS public.spend_user_credits(uuid, int, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.spend_user_credits(
  p_user_id uuid,
  p_amount int,
  p_usage_type text,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(success boolean)
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION public.spend_user_credits(uuid, int, text, text, jsonb) TO service_role;


