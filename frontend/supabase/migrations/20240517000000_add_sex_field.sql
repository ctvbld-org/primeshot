-- Add gender field to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.users.gender IS 'User''s gender information for profile generation';

-- Create index for potentially querying users by gender
CREATE INDEX IF NOT EXISTS idx_users_gender ON public.users(gender);

-- Rollback SQL (commented out):
/*
DROP INDEX IF EXISTS idx_users_gender;
ALTER TABLE public.users DROP COLUMN IF EXISTS gender;
*/ 