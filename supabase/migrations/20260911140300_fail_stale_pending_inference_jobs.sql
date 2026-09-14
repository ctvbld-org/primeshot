-- Fail stale pending inference jobs, not only running ones.
-- pending can stick forever if Modal never calls inference-start/complete
-- (e.g. S3 write failure while AWS is unavailable).
-- Refunds go through refund_credits_with_idempotency so they match the credit system.

CREATE OR REPLACE FUNCTION public.cleanup_stuck_inference_jobs()
RETURNS TABLE(
  job_id uuid,
  user_id uuid,
  status text,
  stuck_duration interval,
  action_taken text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  running_timeout_minutes integer := 15;
  pending_timeout_minutes integer := 20;
  stuck_job record;
  refund_amount integer;
  timeout_used integer;
BEGIN
  FOR stuck_job IN
    SELECT
      ij.id,
      ij.user_id,
      ij.status,
      ij.updated_at,
      ij.credits_spent,
      (now() - ij.updated_at) AS stuck_duration
    FROM public.inference_jobs ij
    WHERE (
        ij.status = 'running'
        AND ij.updated_at < (now() - interval '1 minute' * running_timeout_minutes)
      )
      OR (
        ij.status = 'pending'
        AND ij.updated_at < (now() - interval '1 minute' * pending_timeout_minutes)
      )
  LOOP
    timeout_used := CASE
      WHEN stuck_job.status = 'pending' THEN pending_timeout_minutes
      ELSE running_timeout_minutes
    END;

    UPDATE public.inference_jobs
    SET
      status = 'failed',
      error_message = CASE
        WHEN stuck_job.status = 'pending' THEN
          'Job timed out waiting for server after ' || timeout_used || ' minutes'
        ELSE
          'Job timed out after ' || timeout_used || ' minutes'
      END,
      completed_at = now(),
      updated_at = now()
    WHERE id = stuck_job.id
      AND status IN ('running', 'pending');

    refund_amount := 0;
    IF COALESCE(stuck_job.credits_spent, 0) > 0 THEN
      PERFORM *
      FROM public.refund_credits_with_idempotency(
        stuck_job.user_id,
        stuck_job.id,
        stuck_job.credits_spent,
        'Refund: inference job timed out (job_id: ' || stuck_job.id || ')',
        'inference_failure_refund_' || stuck_job.id::text
      );
      refund_amount := stuck_job.credits_spent;
    END IF;

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

CREATE OR REPLACE FUNCTION public.should_cleanup_stuck_inference_jobs()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.inference_jobs
    WHERE (
        status = 'running'
        AND updated_at < (now() - interval '15 minutes')
      )
      OR (
        status = 'pending'
        AND updated_at < (now() - interval '20 minutes')
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_stuck_inference_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION public.should_cleanup_stuck_inference_jobs() TO service_role;

-- Rollback:
-- Restore supabase/migrations/20250902000000_add_inference_timeout_handling.sql
