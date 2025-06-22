-- Fix training_jobs progress scale to match UI expectations (0-100 instead of 0.0-1.0)
-- This migration only changes the progress column scale

-- Drop the existing progress check constraint
ALTER TABLE public.training_jobs DROP CONSTRAINT IF EXISTS training_jobs_progress_check;

-- Update progress column to use 0-100 scale instead of 0.0-1.0
ALTER TABLE public.training_jobs 
ADD CONSTRAINT training_jobs_progress_check 
CHECK (progress >= 0 AND progress <= 100);

-- Convert existing progress values from 0.0-1.0 scale to 0-100 scale
UPDATE public.training_jobs 
SET progress = progress * 100 
WHERE progress <= 1.0;

-- Update column comment to reflect new scale
COMMENT ON COLUMN public.training_jobs.progress IS 'Training progress from 0 to 100';

-- Enable realtime for training_jobs table
ALTER publication supabase_realtime ADD TABLE public.training_jobs; 