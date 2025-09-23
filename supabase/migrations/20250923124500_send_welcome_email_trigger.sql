-- Enable pg_net extension for HTTP from Postgres (no-op if already enabled)
create extension if not exists pg_net;

-- Trigger function to post signup data to Edge Function (id, email, full_name)
create or replace function public.send_welcome_email_after_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _project_ref text := current_setting('app.settings.project_ref', true);
  _hook_secret text := current_setting('app.settings.welcome_hook_secret', true);
  _url text;
  _headers jsonb;
  _full_name text;
begin
  -- Extract full_name similar to public.handle_new_user
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

  if _project_ref is null or _project_ref = '' then
    raise notice 'send_welcome_email_after_signup: project_ref not set; skipping call';
    return NEW;
  end if;

  if _hook_secret is null or _hook_secret = '' then
    raise notice 'send_welcome_email_after_signup: welcome_hook_secret not set; skipping call';
    return NEW;
  end if;

  _url := 'https://' || _project_ref || '.functions.supabase.co/send-welcome-email';
  _headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-hook-secret', _hook_secret
  );

  perform net.http_post(
    url := _url,
    headers := _headers,
    body := jsonb_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'full_name', _full_name
    )
  );

  return NEW;
end;
$$;

-- Create a dedicated trigger that runs after a new auth user is inserted
drop trigger if exists on_auth_user_created_welcome_email on auth.users;
create trigger on_auth_user_created_welcome_email
after insert on auth.users
for each row
execute function public.send_welcome_email_after_signup();

-- NOTE: After applying this migration, set the required DB settings once (replace values):
-- alter database postgres set app.settings.project_ref = '<your-project-ref>'; -- e.g. abcd1234
-- alter database postgres set app.settings.welcome_hook_secret = '<your-random-secret>';


