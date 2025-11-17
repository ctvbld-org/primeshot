-- Add service_role_key to config table for Edge Function authorization
ALTER TABLE app.config 
ADD COLUMN IF NOT EXISTS service_role_key text;

-- Update the config with service role key (MUST BE SET AFTER MIGRATION)
COMMENT ON COLUMN app.config.service_role_key IS 
'Service role key for authorizing Edge Function calls. Set this after migration using:
UPDATE app.config SET service_role_key = ''your-service-role-key-here'' WHERE id = 1;';

