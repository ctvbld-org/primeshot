-- Add timeout handling for stuck inference jobs
-- Jobs stuck in 'running' status for more than 15 minutes should be marked as failed

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

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.cleanup_stuck_inference_jobs() TO service_role;

-- Add a function to check if cleanup should run (similar to queue triggers)
CREATE OR REPLACE FUNCTION public.should_cleanup_stuck_inference_jobs()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.inference_jobs 
    WHERE status = 'running' 
      AND updated_at < (now() - interval '15 minutes')
  );
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.should_cleanup_stuck_inference_jobs() TO service_role;
