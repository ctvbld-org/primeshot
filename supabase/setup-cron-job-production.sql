-- ============================================================================
-- Setup Hourly Cron Job for Monthly Credit Allocation - PRODUCTION
-- ============================================================================
-- ⚠️ THIS IS FOR PRODUCTION - USE PRODUCTION SERVICE ROLE KEY
-- Run this DIRECTLY in Supabase Dashboard > SQL Editor (Production Project)
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

-- Step 4: Create the cron job for PRODUCTION
-- TODO: Update these values:
-- 1. Replace YOUR-PRODUCTION-URL with your production Supabase URL
-- 2. Replace YOUR-PRODUCTION-SERVICE-ROLE-KEY with your production service key
--    Get it from: Supabase Dashboard > Settings > API > service_role key
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
      'https://api.primeshot.ai',  -- ⚠️ e.g., https://xxxxx.supabase.co
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d21wZnloYmFrcnhtbG1rcXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzQzNDMzNywiZXhwIjoyMDU5MDEwMzM3fQ.3hxIAgOufxzZDG7KpLanOgXxu8zp1dPerQLtE4vF1kw',  -- ⚠️ REPLACE THIS!
      'f8e6a86f842b843434dc66e03693f71f2c000d609ff5cc686c8bab2688a93029'  -- Cron secret
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

-- Check current time (UTC)
SELECT NOW() AT TIME ZONE 'UTC' AS current_utc_time;

-- ============================================================================
-- Expected Output:
-- ============================================================================
-- jobname: award-monthly-subscription-credits
-- schedule: 0 * * * * (hourly)
-- active: true
-- Next run: Top of next hour (e.g., if now is 14:35, next run is 15:00)
-- ============================================================================

