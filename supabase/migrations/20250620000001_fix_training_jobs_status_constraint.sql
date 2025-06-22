-- Fix training_jobs status constraint to include 'completed' status
-- This resolves the constraint violation error when jobs are marked as completed

-- Drop the existing status check constraint
ALTER TABLE public.training_jobs DROP CONSTRAINT IF EXISTS training_jobs_status_check;

-- Add new constraint with consistent status values that match frontend expectations
ALTER TABLE public.training_jobs 
ADD CONSTRAINT training_jobs_status_check 
CHECK (status IN ('queued', 'running', 'completed', 'failed'));

-- Update any existing 'success' status to 'completed' for consistency
UPDATE public.training_jobs 
SET status = 'completed' 
WHERE status = 'success';

-- Update column comment to reflect correct status values
COMMENT ON COLUMN public.training_jobs.status IS 'Current status: queued, running, completed, failed'; 