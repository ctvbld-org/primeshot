-- Add detailed logging to handle_new_user to diagnose the issue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _full_name text;
  _avatar_url text;
  _preferred_language text;
BEGIN
  -- Log the start
  RAISE LOG 'handle_new_user: START for user ID: %, email: %', NEW.id, NEW.email;
  
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
  
  RAISE LOG 'handle_new_user: Extracted full_name: %, avatar_url: %', _full_name, _avatar_url;

  -- Insert into public.users
  RAISE LOG 'handle_new_user: Attempting insert into public.users';
  INSERT INTO public.users (
    id, email, full_name, avatar_url, created_at, updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    _full_name,
    _avatar_url,
    timezone('utc', now()),
    timezone('utc', now())
  );
  RAISE LOG 'handle_new_user: Successfully inserted into public.users';

  -- Initialize user_settings
  _preferred_language := coalesce(
    NEW.raw_user_meta_data->>'preferred_language',
    NEW.raw_user_meta_data->>'locale',
    'en-GB'
  );
  
  RAISE LOG 'handle_new_user: Attempting insert into user_settings with language: %', _preferred_language;
  INSERT INTO public.user_settings (user_id, preferred_language, created_at, updated_at)
  VALUES (NEW.id, _preferred_language, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET
    preferred_language = excluded.preferred_language,
    updated_at = now();
  RAISE LOG 'handle_new_user: Successfully inserted into user_settings';

  RAISE LOG 'handle_new_user: COMPLETE for user ID: %', NEW.id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log detailed error but don't block signup
  RAISE LOG 'handle_new_user ERROR for user ID %: SQLERRM=%, SQLSTATE=%, DETAIL=%',
    NEW.id,
    SQLERRM,
    SQLSTATE,
    SQLERRM;
  RETURN NEW;
END;
$$;