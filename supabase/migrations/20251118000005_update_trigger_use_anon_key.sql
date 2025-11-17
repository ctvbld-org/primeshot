-- Update trigger to use anon_key (public key, safe to use)
CREATE OR REPLACE FUNCTION public.send_welcome_email_after_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _project_ref text;
  _hook_secret text;
  _anon_key text;
  _url text;
  _headers jsonb;
  _full_name text;
  _locale text;
BEGIN
  -- Load config
  SELECT c.project_ref, c.welcome_hook_secret, c.anon_key
  INTO _project_ref, _hook_secret, _anon_key
  FROM app.config c
  WHERE c.id = 1;

  IF COALESCE(_project_ref, '') = '' OR COALESCE(_hook_secret, '') = '' OR COALESCE(_anon_key, '') = '' THEN
    RAISE NOTICE 'send_welcome_email_after_signup: config incomplete';
    RETURN NEW;
  END IF;

  -- Extract full_name
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NULLIF(CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'given_name', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'family_name', '')
    ), ' '),
    NEW.raw_user_meta_data->>'user_name'
  );

  -- Extract locale
  _locale := COALESCE(NEW.raw_user_meta_data->>'locale', 'en-GB');

  -- Build URL
  _url := 'https://' || _project_ref || '.functions.supabase.co/send-welcome-email';
  
  -- Build headers with Authorization using anon_key (public, safe to use)
  -- Security is handled by x-hook-secret
  _headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || _anon_key,
    'x-hook-secret', _hook_secret
  );

  -- Make HTTP call
  PERFORM net.http_post(
    url := _url,
    headers := _headers,
    body := jsonb_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'full_name', _full_name,
      'locale', _locale
    )
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.send_welcome_email_after_signup IS 
'Sends welcome email via Edge Function after user signup. Uses anon_key for authorization (safe) and x-hook-secret for authentication.';

