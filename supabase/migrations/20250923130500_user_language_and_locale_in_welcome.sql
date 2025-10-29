-- Upsert preferred_language into public.user_settings on signup
create or replace function public.init_user_language()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _locale text := coalesce(NEW.raw_user_meta_data->>'locale', 'en-GB');
begin
  insert into public.user_settings (user_id, preferred_language, created_at, updated_at)
  values (NEW.id, _locale, now(), now())
  on conflict (user_id) do update
  set preferred_language = excluded.preferred_language, updated_at = now();
  return NEW;
end;
$$;

drop trigger if exists on_auth_user_created_language on auth.users;
create trigger on_auth_user_created_language
after insert on auth.users
for each row execute function public.init_user_language();

-- Include locale in the welcome-email trigger payload
create or replace function public.send_welcome_email_after_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _project_ref text;
  _hook_secret text;
  _url text;
  _headers jsonb;
  _full_name text;
  _locale text;
begin
  select c.project_ref, c.welcome_hook_secret
  into _project_ref, _hook_secret
  from app.config c
  where c.id = 1;

  if coalesce(_project_ref, '') = '' or coalesce(_hook_secret, '') = '' then
    return NEW;
  end if;

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

  _locale := coalesce(NEW.raw_user_meta_data->>'locale', 'en-GB');

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
      'full_name', _full_name,
      'locale', _locale
    )
  );

  return NEW;
end;
$$;



