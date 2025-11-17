-- ============================================================================
-- WELCOME EMAIL SETUP SCRIPT
-- ============================================================================
-- This script configures the welcome email system for your Supabase project.
-- 
-- PREREQUISITES:
-- 1. Generate a secure random secret:
--    openssl rand -hex 32
-- 
-- 2. Get your Supabase project reference from:
--    - Project URL: https://[PROJECT_REF].supabase.co
--    - Or from: https://app.supabase.com/project/[PROJECT_REF]/settings/general
-- 
-- 3. Set the WELCOME_HOOK_SECRET environment variable in your Edge Function:
--    - Go to: https://app.supabase.com/project/[PROJECT_REF]/functions/send-welcome-email/secrets
--    - Add: WELCOME_HOOK_SECRET = [your-generated-secret]
-- 
-- 4. Ensure these environment variables are also set:
--    - RESEND_API_KEY: Your Resend API key
--    - RESEND_FROM: Email address to send from (e.g., "Primeshot <info@mail.primeshot.ai>")
--    - RESEND_REPLY_TO: Reply-to address (optional, defaults to RESEND_FROM)
-- ============================================================================

-- Check current configuration status
SELECT * FROM app.welcome_email_status;

-- ============================================================================
-- STEP 1: Update configuration (REPLACE VALUES BELOW)
-- ============================================================================
-- Replace 'YOUR_PROJECT_REF' with your actual project reference
-- Replace 'YOUR_SECURE_SECRET_HERE' with the secret you generated
-- ============================================================================

SELECT app.update_welcome_email_config(
  'YOUR_PROJECT_REF',        -- e.g., 'abcdefghijklmn'
  'YOUR_SECURE_SECRET_HERE'  -- from: openssl rand -hex 32
);

-- ============================================================================
-- STEP 2: Verify configuration
-- ============================================================================
SELECT * FROM app.welcome_email_status;

-- Should show:
-- is_configured | status       | last_updated
-- --------------+--------------+-------------
-- true          | Configured   | [timestamp]

-- ============================================================================
-- STEP 3: Test the trigger function (optional - for debugging)
-- ============================================================================
-- This shows what the trigger will do, but doesn't actually send an email
DO $$
DECLARE
  _project_ref text;
  _hook_secret text;
  _url text;
BEGIN
  -- Load config
  SELECT c.project_ref, c.welcome_hook_secret
  INTO _project_ref, _hook_secret
  FROM app.config c
  WHERE c.id = 1;
  
  -- Build URL
  _url := 'https://' || _project_ref || '.functions.supabase.co/send-welcome-email';
  
  RAISE NOTICE 'Configuration loaded:';
  RAISE NOTICE '  Project Ref: %', _project_ref;
  RAISE NOTICE '  Secret Set: %', (_hook_secret IS NOT NULL AND _hook_secret != 'SET_ME');
  RAISE NOTICE '  Target URL: %', _url;
END $$;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
-- If emails are not being sent, check:
-- 
-- 1. Database configuration:
SELECT * FROM app.config WHERE id = 1;
--    - Ensure project_ref and welcome_hook_secret are not 'SET_ME'
-- 
-- 2. Edge Function logs:
--    - Go to: https://app.supabase.com/project/[PROJECT_REF]/functions/send-welcome-email/logs
--    - Look for authentication errors or Resend API errors
-- 
-- 3. Database logs for trigger execution:
--    - Go to: https://app.supabase.com/project/[PROJECT_REF]/logs/postgres-logs
--    - Filter for: "send_welcome_email_after_signup"
--    - Look for NOTICE messages about missing config
-- 
-- 4. Test with a new user signup:
--    - Create a test account
--    - Check Edge Function logs immediately after
-- 
-- 5. Verify pg_net requests (requires superuser):
-- SELECT * FROM net._http_response ORDER BY created DESC LIMIT 10;
-- ============================================================================

