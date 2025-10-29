-- Migration: Grant service_role privileges on users table
-- Fix for: service_role missing table-level permissions on users table in production
-- This is separate from RLS policies - table grants must exist first

-- Grant all privileges to service_role on users table
GRANT ALL PRIVILEGES ON TABLE public.users TO service_role;

-- Also grant to anon role for consistency with staging
GRANT ALL PRIVILEGES ON TABLE public.users TO anon;

COMMENT ON TABLE public.users IS 
  'User profiles table with service_role and anon grants for Edge Functions';
