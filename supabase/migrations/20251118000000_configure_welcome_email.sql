-- Configure welcome email system
-- This migration sets up the app.config table with proper values

-- Ensure pg_net extension is enabled for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to update welcome email configuration
-- Run this after deployment with proper environment-specific values
CREATE OR REPLACE FUNCTION app.update_welcome_email_config(
  p_project_ref text,
  p_hook_secret text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE app.config
  SET 
    project_ref = p_project_ref,
    welcome_hook_secret = p_hook_secret,
    updated_at = now()
  WHERE id = 1;
  
  RAISE NOTICE 'Welcome email configuration updated successfully';
END;
$$;

-- Grant execute permission to authenticated users (admin only in practice)
GRANT EXECUTE ON FUNCTION app.update_welcome_email_config TO service_role;

COMMENT ON FUNCTION app.update_welcome_email_config IS 
'Updates the welcome email configuration. Should be called after deployment with:
- p_project_ref: Your Supabase project reference (e.g., "abcdefghijklmn")
- p_hook_secret: A secure random secret (generate with: openssl rand -hex 32)

Example:
SELECT app.update_welcome_email_config(
  ''your-project-ref'',
  ''your-secure-random-secret-here''
);

After updating, ensure the Edge Function has WELCOME_HOOK_SECRET env var set to match.';

-- Add a view to check if configuration is properly set
CREATE OR REPLACE VIEW app.welcome_email_status AS
SELECT
  CASE 
    WHEN project_ref = 'SET_ME' OR project_ref IS NULL THEN false
    WHEN welcome_hook_secret = 'SET_ME' OR welcome_hook_secret IS NULL THEN false
    ELSE true
  END AS is_configured,
  CASE 
    WHEN project_ref = 'SET_ME' OR project_ref IS NULL THEN 'project_ref not set'
    WHEN welcome_hook_secret = 'SET_ME' OR welcome_hook_secret IS NULL THEN 'welcome_hook_secret not set'
    ELSE 'Configured'
  END AS status,
  updated_at as last_updated
FROM app.config
WHERE id = 1;

GRANT SELECT ON app.welcome_email_status TO service_role;

COMMENT ON VIEW app.welcome_email_status IS 
'Check if welcome email is properly configured. Query this view to verify setup.';

