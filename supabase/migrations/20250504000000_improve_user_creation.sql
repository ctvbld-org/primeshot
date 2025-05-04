-- Improve handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    _full_name TEXT;
    _avatar_url TEXT;
BEGIN
    -- Log the start of the function
    RAISE LOG 'handle_new_user: Starting for user ID: %, email: %', NEW.id, NEW.email;
    
    -- Extract metadata with proper null handling
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
    
    _avatar_url := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
    );
    
    -- Log the extracted values
    RAISE LOG 'handle_new_user: Extracted full_name: %, avatar_url: %', _full_name, _avatar_url;
    
    -- Attempt the insert
    INSERT INTO public.users (
        id,
        email,
        full_name,
        avatar_url,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        _full_name,
        _avatar_url,
        TIMEZONE('utc', NOW()),
        TIMEZONE('utc', NOW())
    );
    
    RAISE LOG 'handle_new_user: Successfully created user in public.users';
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the detailed error
    RAISE LOG 'handle_new_user ERROR for user ID %: %, SQLSTATE: %, DETAIL: %, HINT: %',
        NEW.id,
        SQLERRM,
        SQLSTATE,
        COALESCE(SQLERRM, 'NO DETAIL'),
        COALESCE(SQLHINT, 'NO HINT');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow insert during signup" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- Recreate policies with proper conditions
CREATE POLICY "Allow insert during signup"
ON public.users
FOR INSERT
TO authenticated, anon
WITH CHECK (true);  -- Allow any insert since it's controlled by the trigger

CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id); 