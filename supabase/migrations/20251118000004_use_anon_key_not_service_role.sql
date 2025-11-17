-- Fix: Use anon_key instead of service_role_key (safer and appropriate for this use case)
ALTER TABLE app.config 
DROP COLUMN IF EXISTS service_role_key;

ALTER TABLE app.config 
ADD COLUMN IF NOT EXISTS anon_key text;

COMMENT ON COLUMN app.config.anon_key IS 
'Anon (public) key for authorizing Edge Function calls. This is safe to store as it''s meant to be public.
Set this after migration using:
UPDATE app.config SET anon_key = ''your-anon-key-here'' WHERE id = 1;

Get it from: Project Settings > API > anon public key';

