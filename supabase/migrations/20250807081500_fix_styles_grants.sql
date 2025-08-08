-- Migration: Grant DML privileges on styles to authenticated users
-- Purpose: Allow admins (authenticated with users.admin = true via RLS) to perform writes
-- Note: RLS policies on public.styles still enforce admin-only writes

GRANT INSERT, UPDATE, DELETE ON public.styles TO authenticated;


