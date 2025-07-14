-- Migration: Allow 'completed' as a valid status for training_jobs
ALTER TABLE training_jobs DROP CONSTRAINT IF EXISTS training_jobs_status_check;
ALTER TABLE training_jobs ADD CONSTRAINT training_jobs_status_check CHECK (status IN ('queued', 'running', 'completed', 'failed')); 