-- Rename sex column to gender if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'sex' 
    AND table_schema = 'public'
  ) THEN
    -- Rename the column
    ALTER TABLE public.users RENAME COLUMN sex TO gender;
    
    -- Clean up old index if it exists
    IF EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_users_sex' 
      AND tablename = 'users' 
      AND schemaname = 'public'
    ) THEN
      DROP INDEX IF EXISTS idx_users_sex;
      CREATE INDEX IF NOT EXISTS idx_users_gender ON public.users(gender);
    END IF;
    
    -- Update column comment if it exists
    COMMENT ON COLUMN public.users.gender IS 'User''s gender information for profile generation';
  END IF;
END
$$; 