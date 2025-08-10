-- Rename table public.images -> public.uploaded_images
-- This preserves data, indexes, constraints, RLS policies, and privileges.
-- Constraint and policy names are left as-is for safety; they can be renamed later for clarity.

BEGIN;

-- Only rename if the source table exists and target does not
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'images'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'uploaded_images'
  ) THEN
    ALTER TABLE public.images RENAME TO uploaded_images;
  END IF;
END $$;

-- Optional: update table comment
COMMENT ON TABLE public.uploaded_images IS 'Stores user-uploaded images and their metadata (renamed from images)';

COMMIT;


