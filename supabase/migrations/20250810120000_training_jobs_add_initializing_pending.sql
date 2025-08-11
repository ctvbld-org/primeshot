-- Add 'initializing' and 'pending' to training_jobs status constraint
-- Also set default status to 'initializing'

DO $$
BEGIN
  -- Drop existing CHECK constraint if present
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'training_jobs_status_check'
      AND conrelid = 'public.training_jobs'::regclass
  ) THEN
    ALTER TABLE public.training_jobs
      DROP CONSTRAINT training_jobs_status_check;
  END IF;

  -- Recreate CHECK constraint with expanded set
  ALTER TABLE public.training_jobs
    ADD CONSTRAINT training_jobs_status_check
    CHECK (status IN ('initializing', 'queued', 'pending', 'running', 'completed', 'failed'));

  -- Set default to 'initializing'
  ALTER TABLE public.training_jobs
    ALTER COLUMN status SET DEFAULT 'initializing';

  -- Update column comment
  COMMENT ON COLUMN public.training_jobs.status IS 'Current status: initializing, queued, pending, running, completed, failed';
END $$;


