-- Reset and reapply all permissions
-- First, revoke all permissions to start clean
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON SCHEMA public FROM anon, authenticated;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.style_configs, public.style_options TO anon;

-- Explicitly grant permissions on each table to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.styles TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.images TO authenticated;
GRANT ALL ON public.sessions TO authenticated;
GRANT ALL ON public.user_progress TO authenticated;
GRANT ALL ON public.completed_user_journeys TO authenticated;
GRANT ALL ON public.style_configs TO authenticated;
GRANT ALL ON public.style_options TO authenticated;
GRANT ALL ON public.user_language_preferences TO authenticated;

-- Set up default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
    
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO anon;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION public.get_language_preference TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_language_preference TO authenticated;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_user_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_language_preferences ENABLE ROW LEVEL SECURITY;

-- Reapply RLS policies
-- Users table
DROP POLICY IF EXISTS "Allow insert during signup" ON public.users;
CREATE POLICY "Allow insert during signup" ON public.users
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Styles table
DROP POLICY IF EXISTS "Users can manage their own styles" ON public.styles;
CREATE POLICY "Users can manage their own styles" ON public.styles
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Style configs and options (public read access)
DROP POLICY IF EXISTS "Public read access" ON public.style_configs;
CREATE POLICY "Public read access" ON public.style_configs
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Public read access" ON public.style_options;
CREATE POLICY "Public read access" ON public.style_options
    FOR SELECT TO anon, authenticated
    USING (true);

-- Orders table
DROP POLICY IF EXISTS "Users can manage their own orders" ON public.orders;
CREATE POLICY "Users can manage their own orders" ON public.orders
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Images table
DROP POLICY IF EXISTS "Users can manage their own images" ON public.images;
CREATE POLICY "Users can manage their own images" ON public.images
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Sessions table
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.sessions;
CREATE POLICY "Users can manage their own sessions" ON public.sessions
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- User progress table
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.user_progress;
CREATE POLICY "Users can manage their own progress" ON public.user_progress
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Completed user journeys table
DROP POLICY IF EXISTS "Users can view their own journeys" ON public.completed_user_journeys;
CREATE POLICY "Users can view their own journeys" ON public.completed_user_journeys
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Language preferences policies
DROP POLICY IF EXISTS "Users can read their own language preference" ON public.user_language_preferences;
CREATE POLICY "Users can read their own language preference" ON public.user_language_preferences
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own language preference" ON public.user_language_preferences;
CREATE POLICY "Users can update their own language preference" ON public.user_language_preferences
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own language preference" ON public.user_language_preferences;
CREATE POLICY "Users can insert their own language preference" ON public.user_language_preferences
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id); 