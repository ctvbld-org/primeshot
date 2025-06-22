-- Add message field to training_jobs table for clearer progress tracking
-- This allows us to store descriptive progress messages separate from log URLs

-- Add message column to training_jobs table
ALTER TABLE public.training_jobs 
ADD COLUMN IF NOT EXISTS message TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.training_jobs.message IS 'Current progress message (e.g., "Loading Flux model", "Training Face Model")';

-- Migrate existing log_url values that look like progress messages to the new message field
-- Only migrate short messages (< 100 chars) that don't look like URLs
UPDATE public.training_jobs 
SET message = log_url 
WHERE log_url IS NOT NULL 
  AND LENGTH(log_url) < 100 
  AND log_url NOT LIKE 'http%' 
  AND log_url NOT LIKE 's3://%'; 