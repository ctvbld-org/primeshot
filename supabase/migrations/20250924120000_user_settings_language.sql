-- Create/replace RPCs to manage user preferred language and ensure settings on signup

-- 1) Ensure user_settings row is created on signup (extend handle_new_user)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _full_name text;
  _avatar_url text;
  _preferred_language text;
begin
  -- Extract metadata
  _full_name := coalesce(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    nullif(concat(
      coalesce(NEW.raw_user_meta_data->>'given_name',''),
      ' ',
      coalesce(NEW.raw_user_meta_data->>'family_name','')
    ), ' '),
    NEW.raw_user_meta_data->>'user_name'
  );

  _avatar_url := coalesce(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Insert into public.users (idempotent on trigger redeploy)
  insert into public.users (
    id, email, full_name, avatar_url, created_at, updated_at
  ) values (
    NEW.id,
    NEW.email,
    _full_name,
    _avatar_url,
    timezone('utc', now()),
    timezone('utc', now())
  );

  -- Initialize user_settings preferred_language if available in metadata
  _preferred_language := coalesce(
    NEW.raw_user_meta_data->>'preferred_language',
    null
  );

  insert into public.user_settings (user_id, preferred_language, created_at, updated_at)
  values (NEW.id, _preferred_language, now(), now())
  on conflict (user_id) do update set
    preferred_language = excluded.preferred_language,
    updated_at = now();

  return NEW;
exception when others then
  -- Do not block signup; log and continue
  raise log 'handle_new_user language/setup ERROR for user ID %: %', NEW.id, SQLERRM;
  return NEW;
end;
$$;

-- 2) RPC to set preferred language for current user
create or replace function public.set_user_language(new_language varchar)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id, preferred_language, created_at, updated_at)
  values (auth.uid(), new_language, now(), now())
  on conflict (user_id) do update set
    preferred_language = excluded.preferred_language,
    updated_at = now();
end;
$$;

-- 3) RPC to get preferred language for current user
create or replace function public.get_user_language()
returns varchar
language plpgsql
security definer
set search_path = public
as $$
declare
  lang varchar;
begin
  select us.preferred_language into lang
  from public.user_settings us
  where us.user_id = auth.uid();

  return lang;
end;
$$;


