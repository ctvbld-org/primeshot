-- Add estimated_duration field to training_jobs table for better time estimation
-- This field will store the estimated total training time in seconds

-- Add estimated_duration column to training_jobs table
ALTER TABLE public.training_jobs 
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER;

-- Add image_count column if it doesn't exist (for better estimation)
ALTER TABLE public.training_jobs 
ADD COLUMN IF NOT EXISTS image_count INTEGER;

-- Add modal_job_id column if it doesn't exist (for tracking external job)
ALTER TABLE public.training_jobs 
ADD COLUMN IF NOT EXISTS modal_job_id TEXT;

-- Add error_message column if it doesn't exist
ALTER TABLE public.training_jobs 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.training_jobs.estimated_duration IS 'Estimated total training time in seconds based on image count and model complexity';
COMMENT ON COLUMN public.training_jobs.image_count IS 'Number of training images uploaded';
COMMENT ON COLUMN public.training_jobs.modal_job_id IS 'External Modal job ID for tracking';
COMMENT ON COLUMN public.training_jobs.error_message IS 'Detailed error message if training failed';

-- Update existing jobs with default estimated duration based on typical training times
-- Default: 25 minutes (1500 seconds) for standard training
UPDATE public.training_jobs 
SET estimated_duration = 1500
WHERE estimated_duration IS NULL; 