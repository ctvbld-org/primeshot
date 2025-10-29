-- Create a dedicated config table (avoids ALTER DATABASE permission issues)
create schema if not exists app;

create table if not exists app.config (
  id integer primary key default 1,
  project_ref text not null,
  welcome_hook_secret text not null,
  updated_at timestamptz not null default now()
);

-- Ensure a single-row config by enforcing id = 1
insert into app.config (id, project_ref, welcome_hook_secret)
values (1, 'SET_ME', 'SET_ME')
on conflict (id) do nothing;

-- Update trigger function to read from app.config instead of DB settings
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
begin
  -- Load config
  select c.project_ref, c.welcome_hook_secret
  into _project_ref, _hook_secret
  from app.config c
  where c.id = 1;

  if _project_ref is null or _project_ref = '' then
    raise notice 'send_welcome_email_after_signup: project_ref missing; skipping call';
    return NEW;
  end if;
  if _hook_secret is null or _hook_secret = '' then
    raise notice 'send_welcome_email_after_signup: welcome_hook_secret missing; skipping call';
    return NEW;
  end if;

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


