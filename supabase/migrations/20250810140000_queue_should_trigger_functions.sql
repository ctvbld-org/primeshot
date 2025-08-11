-- Functions to decide when to trigger training/inference queues

CREATE OR REPLACE FUNCTION public.should_trigger_training_queue()
RETURNS boolean
LANGUAGE sql
STABLE
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

GRANT EXECUTE ON FUNCTION public.should_trigger_training_queue() TO service_role;

CREATE OR REPLACE FUNCTION public.should_trigger_inference_queue()
RETURNS boolean
LANGUAGE sql
STABLE
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

GRANT EXECUTE ON FUNCTION public.should_trigger_inference_queue() TO service_role;


