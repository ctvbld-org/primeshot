-- Fix: Use service_role_key from config table, not from current_setting
CREATE OR REPLACE FUNCTION public.send_welcome_email_after_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _project_ref text;
  _hook_secret text;
  _service_role_key text;
  _url text;
  _headers jsonb;
  _full_name text;
  _locale text;
BEGIN
  -- Load config INCLUDING service_role_key
  SELECT c.project_ref, c.welcome_hook_secret, c.service_role_key
  INTO _project_ref, _hook_secret, _service_role_key
  FROM app.config c
  WHERE c.id = 1;

  IF COALESCE(_project_ref, '') = '' OR COALESCE(_hook_secret, '') = '' OR COALESCE(_service_role_key, '') = '' THEN
    RAISE NOTICE 'send_welcome_email_after_signup: config incomplete (project_ref: %, hook_secret: %, service_role: %)', 
      (_project_ref IS NOT NULL), (_hook_secret IS NOT NULL), (_service_role_key IS NOT NULL);
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
  
  -- Build headers with Authorization using service_role_key from config table
  _headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || _service_role_key,
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

