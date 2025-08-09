-- Add non-negative credits_spent column to inference_jobs
-- Tracks how many credits were consumed by a given inference job

BEGIN;

ALTER TABLE public.inference_jobs
ADD COLUMN IF NOT EXISTS credits_spent integer NOT NULL DEFAULT 0;

-- Ensure non-negative values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inference_jobs_credits_spent_nonneg'
  ) THEN
    ALTER TABLE public.inference_jobs
    ADD CONSTRAINT inference_jobs_credits_spent_nonneg CHECK (credits_spent >= 0);
  END IF;
END $$;

COMMENT ON COLUMN public.inference_jobs.credits_spent IS 'Number of credits consumed by this inference job (non-negative)';

COMMIT;



