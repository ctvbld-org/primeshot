-- Add retry_after to inference_jobs and create an atomic claim RPC

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inference_jobs' AND column_name = 'retry_after'
  ) THEN
    ALTER TABLE public.inference_jobs
      ADD COLUMN retry_after timestamptz NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.claim_next_queued_inference_job()
RETURNS public.inference_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job public.inference_jobs%rowtype;
  v_limit int := 1;
  v_active int := 0;
BEGIN
  -- Lock the next eligible queued job
  SELECT * INTO v_job
  FROM public.inference_jobs j
  WHERE j.status = 'queued'
    AND (j.retry_after IS NULL OR j.retry_after <= now())
  ORDER BY j.created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Determine per-user concurrent limit
  SELECT s.concurrent_jobs INTO v_limit
  FROM public.user_subscriptions us
  JOIN public.subscriptions s ON s.name = us.plan_name
  WHERE us.user_id = v_job.user_id AND us.status = 'active'
  LIMIT 1;
  IF v_limit IS NULL THEN v_limit := 1; END IF;

  -- Count active jobs for the user
  SELECT COUNT(1) INTO v_active
  FROM public.inference_jobs
  WHERE user_id = v_job.user_id AND status IN ('pending','running');

  IF v_active >= v_limit THEN
    UPDATE public.inference_jobs
      SET retry_after = now() + interval '60 seconds',
          updated_at = now()
      WHERE id = v_job.id;
    RETURN NULL;
  END IF;

  -- Claim by setting to initializing
  UPDATE public.inference_jobs
    SET status = 'initializing', updated_at = now()
    WHERE id = v_job.id
    RETURNING * INTO v_job;

  RETURN v_job;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_next_queued_inference_job() TO service_role;


