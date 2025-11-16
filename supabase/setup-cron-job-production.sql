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

-- ============================================================================
-- JOB 1: Quota Reset Safety Check (Hourly) - PRODUCTION
-- ============================================================================
-- Purpose: Safety net for missed webhook-based quota resets
-- Frequency: Hourly (should rarely find anything to do)
-- ============================================================================

-- Remove existing job (if any)
DO $$
DECLARE
  job_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cron.job 
    WHERE jobname = 'award-monthly-subscription-credits'
  ) INTO job_exists;
  
  IF job_exists THEN
    PERFORM cron.unschedule('award-monthly-subscription-credits');
    RAISE NOTICE 'Removed existing quota reset job';
  ELSE
    RAISE NOTICE 'No existing quota reset job to remove';
  END IF;
END $$;

-- Create the quota reset job
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
      'https://api.primeshot.ai',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d21wZnloYmFrcnhtbG1rcXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzQzNDMzNywiZXhwIjoyMDU5MDEwMzM3fQ.3hxIAgOufxzZDG7KpLanOgXxu8zp1dPerQLtE4vF1kw',
      'f8e6a86f842b843434dc66e03693f71f2c000d609ff5cc686c8bab2688a93029'
    )
  );
  RAISE NOTICE 'Created quota reset safety check job (hourly)';
END $$;

-- ============================================================================
-- JOB 2: Expire Purchased Credits (Daily at 2 AM) - PRODUCTION
-- ============================================================================
-- Purpose: Set remaining_credits = 0 for expired credit packs
-- Frequency: Daily at 2 AM (low traffic, credits expire on day boundaries)
-- ============================================================================

-- Remove existing job (if any)
DO $$
DECLARE
  job_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cron.job 
    WHERE jobname = 'expire-purchased-credits'
  ) INTO job_exists;
  
  IF job_exists THEN
    PERFORM cron.unschedule('expire-purchased-credits');
    RAISE NOTICE 'Removed existing expiration job';
  ELSE
    RAISE NOTICE 'No existing expiration job to remove';
  END IF;
END $$;

-- Create the expiration job
DO $$
BEGIN
  PERFORM cron.schedule(
    'expire-purchased-credits',
    '0 2 * * *',  -- Daily at 2 AM UTC
    format(
      $SQL$
      SELECT net.http_post(
        url := '%s/functions/v1/expire-purchased-credits',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s',
          'x-cron-secret', '%s'
        ),
        body := '{}'::jsonb
      ) AS request_id;
      $SQL$,
      'https://api.primeshot.ai',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3d21wZnloYmFrcnhtbG1rcXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzQzNDMzNywiZXhwIjoyMDU5MDEwMzM3fQ.3hxIAgOufxzZDG7KpLanOgXxu8zp1dPerQLtE4vF1kw',
      'f8e6a86f842b843434dc66e03693f71f2c000d609ff5cc686c8bab2688a93029'
    )
  );
  RAISE NOTICE 'Created credit expiration job (daily at 2 AM)';
END $$;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- View all credit-related cron jobs
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  CASE 
    WHEN schedule = '0 * * * *' THEN 'Hourly'
    WHEN schedule = '0 2 * * *' THEN 'Daily at 2 AM'
    ELSE schedule
  END as frequency
FROM cron.job
WHERE jobname IN ('award-monthly-subscription-credits', 'expire-purchased-credits')
ORDER BY jobname;

-- ============================================================================
-- Expected Output:
-- ============================================================================
-- Job 1: award-monthly-subscription-credits
--   Schedule: 0 * * * * (hourly)
--   Active: true
--   Purpose: Safety net for quota resets
--
-- Job 2: expire-purchased-credits
--   Schedule: 0 2 * * * (daily at 2 AM)
--   Active: true
--   Purpose: Expire old credit packs
-- ============================================================================

