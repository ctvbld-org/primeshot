-- Description: Add user profile fields (full_name and avatar_url) to users table
-- and update related RLS policies

-- Add new columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Rollback SQL (commented out):
/*
ALTER TABLE public.users
DROP COLUMN IF EXISTS full_name,
DROP COLUMN IF EXISTS avatar_url;

CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
*/ 