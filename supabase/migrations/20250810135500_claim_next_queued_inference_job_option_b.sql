-- Replace existing inference claim RPC with Option B (stateless per-user head, oldest-eligible)
DROP FUNCTION IF EXISTS public.claim_next_queued_inference_job();

CREATE OR REPLACE FUNCTION public.claim_next_queued_inference_job()
RETURNS public.inference_jobs
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION public.claim_next_queued_inference_job() TO service_role;


