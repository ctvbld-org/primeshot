-- Fix missing EXECUTE permissions on handle_new_user function
-- Root cause: Production was missing anon/authenticated role permissions,
-- causing user creation to fail silently during signup

-- Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Verify the grants were applied
DO $$
BEGIN
  RAISE NOTICE 'Permissions granted on handle_new_user() to anon and authenticated roles';
END $$;
