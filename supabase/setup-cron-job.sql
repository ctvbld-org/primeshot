-- ============================================================================
-- Setup Hourly Cron Job for Monthly Credit Allocation
-- ============================================================================
-- Run this DIRECTLY in Supabase Dashboard > SQL Editor
-- This is NOT a migration - it's operational configuration
-- ============================================================================

-- Step 1: Enable pg_cron (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;

-- Step 3: Remove existing job (if any) - check first
DO $$
DECLARE
  job_exists BOOLEAN;
BEGIN
  -- Check if job exists
  SELECT EXISTS (
    SELECT 1 FROM cron.job 
    WHERE jobname = 'award-monthly-subscription-credits'
  ) INTO job_exists;
  
  -- Only unschedule if it exists
  IF job_exists THEN
    PERFORM cron.unschedule('award-monthly-subscription-credits');
    RAISE NOTICE 'Removed existing cron job';
  ELSE
    RAISE NOTICE 'No existing cron job to remove';
  END IF;
END $$;

-- Step 4: Create the cron job
-- TODO: Replace YOUR-SERVICE-ROLE-KEY with actual key from:
--       Supabase Dashboard > Settings > API > service_role key
DO $$
BEGIN
  PERFORM cron.schedule(
    'award-monthly-subscription-credits',
    '0 * * * *',  -- Every hour, on the hour
    format(
      $SQL$
      SELECT net.http_post(
        url := '%s/functions/v1/award-monthly-credits',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s',
          'x-cron-secret', '%s'
        ),
        body := '{}'::jsonb
      ) AS request_id;
      $SQL$,
      'https://npalbinvsvbyddagwvjx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wYWxiaW52c3ZieWRkYWd3dmp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAzNDAyMSwiZXhwIjoyMDcyNjEwMDIxfQ.3AXeJJi8H2h6LI_HLfQmH2ZMwYdwP78gEG4e4JfK1KU',  -- ⚠️ REPLACE THIS!
      'f8e6a86f842b843434dc66e03693f71f2c000d609ff5cc686c8bab2688a93029'
    )
  );
END $$;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify the job was created
SELECT 
  jobid,
  jobname,
  schedule,  -- Should be: 0 * * * *
  active     -- Should be: true
FROM cron.job
WHERE jobname = 'award-monthly-subscription-credits';

-- View the full command (includes your service role key - that's normal)
SELECT 
  jobname,
  command
FROM cron.job
WHERE jobname = 'award-monthly-subscription-credits';

-- ============================================================================
-- Expected Output:
-- ============================================================================
-- jobname: award-monthly-subscription-credits
-- schedule: 0 * * * * (hourly)
-- active: true
-- ============================================================================

