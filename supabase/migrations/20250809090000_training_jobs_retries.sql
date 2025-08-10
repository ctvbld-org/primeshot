-- Add retry scheduling fields to training_jobs for provider submission backoff
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'training_jobs' AND column_name = 'retry_count'
  ) THEN
    ALTER TABLE public.training_jobs
    ADD COLUMN retry_count integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'training_jobs' AND column_name = 'retry_after'
  ) THEN
    ALTER TABLE public.training_jobs
    ADD COLUMN retry_after timestamptz NULL;
  END IF;

  -- Helpful partial index to pick eligible queued jobs efficiently
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_training_jobs_queued_retry_after'
  ) THEN
    CREATE INDEX idx_training_jobs_queued_retry_after
      ON public.training_jobs (retry_after)
      WHERE status = 'queued';
  END IF;
END $$;


