-- Migration: Add credits_spent column to training_jobs
-- Adds an integer column to track how many credits were spent on each training job.
-- Safe to run repeatedly thanks to IF NOT EXISTS.

ALTER TABLE training_jobs
ADD COLUMN IF NOT EXISTS credits_spent INTEGER DEFAULT 0; 