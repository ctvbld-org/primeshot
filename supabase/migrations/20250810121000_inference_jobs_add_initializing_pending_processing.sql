-- Expand inference_jobs status to include 'initializing' and 'pending' (and 'processing')
-- Also set default to 'initializing'

DO $$
BEGIN
  -- Drop existing CHECK constraint if present
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'inference_jobs_status_check'
      AND conrelid = 'public.inference_jobs'::regclass
  ) THEN
    ALTER TABLE public.inference_jobs
      DROP CONSTRAINT inference_jobs_status_check;
  END IF;

  -- Recreate CHECK constraint with updated set (no 'processing' state)
  ALTER TABLE public.inference_jobs
    ADD CONSTRAINT inference_jobs_status_check
    CHECK (status IN ('initializing', 'queued', 'pending', 'running', 'completed', 'failed'));

  -- Set default to 'initializing'
  ALTER TABLE public.inference_jobs
    ALTER COLUMN status SET DEFAULT 'initializing';

  -- Update column comment
  COMMENT ON COLUMN public.inference_jobs.status IS 'Current status: initializing, queued, pending, running, completed, failed';
END $$;


