-- Setup pg_cron for monthly credit allocation
-- This runs the Edge Function daily at 2 AM UTC
-- NOTE: Update the URL and token below before pushing to staging/production

-- Enable pg_cron extension (should already be enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule the monthly credit allocation job
-- Runs HOURLY (every hour on the hour) for best UX with zero cost impact
-- NOTE: Uses x-cron-secret header instead of Authorization because Supabase API Gateway validates Authorization as JWT
DO $$
BEGIN
  PERFORM cron.schedule(
    'award-monthly-subscription-credits',  -- Job name
    '0 * * * *',  -- Cron schedule: hourly (every hour on the hour)
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
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wYWxiaW52c3ZieWRkYWd3dmp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAzNDAyMSwiZXhwIjoyMDcyNjEwMDIxfQ.3AXeJJi8H2h6LI_HLfQmH2ZMwYdwP78gEG4e4JfK1KU',
      'f8e6a86f842b843434dc66e03693f71f2c000d609ff5cc686c8bab2688a93029'
    )
  );
END $$;

-- View scheduled cron jobs
-- Run this query to see all scheduled jobs:
-- SELECT jobid, jobname, schedule, active FROM cron.job;

-- View cron job run history
-- Run this query to see execution history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Verify database settings
-- Run this query to verify settings were applied:
-- SELECT name, setting FROM pg_settings WHERE name LIKE 'app.settings%';

COMMENT ON EXTENSION pg_cron IS 
'Cron-based job scheduler for PostgreSQL. Used to run monthly credit allocation daily.';

