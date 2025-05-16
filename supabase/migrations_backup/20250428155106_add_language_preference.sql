-- Create language preferences table
CREATE TABLE IF NOT EXISTS public.user_language_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_language VARCHAR DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.user_language_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own language preference" ON public.user_language_preferences;
CREATE POLICY "Users can read their own language preference" ON public.user_language_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own language preference" ON public.user_language_preferences;
CREATE POLICY "Users can update their own language preference" ON public.user_language_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own language preference" ON public.user_language_preferences;
CREATE POLICY "Users can insert their own language preference" ON public.user_language_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create function to get language preference
CREATE OR REPLACE FUNCTION public.get_language_preference()
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    lang VARCHAR;
BEGIN
    SELECT preferred_language INTO lang
    FROM public.user_language_preferences
    WHERE user_id = auth.uid();
    
    -- Return NULL if no preference is set, allowing i18next to use its default
    RETURN lang;
END;
$$;

-- Create function to update language preference
CREATE OR REPLACE FUNCTION public.update_language_preference(new_language VARCHAR)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_language_preferences (user_id, preferred_language)
    VALUES (auth.uid(), new_language)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        preferred_language = EXCLUDED.preferred_language,
        updated_at = NOW();
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_language_preference TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_language_preference TO authenticated;

-- Rollback statements (commented out)
/*
DROP POLICY IF EXISTS "Users can update their own language preference" ON auth.users;
DROP FUNCTION IF EXISTS public.update_language_preference;
DROP FUNCTION IF EXISTS public.get_language_preference;
ALTER TABLE auth.users DROP COLUMN IF EXISTS preferred_language;
*/ 