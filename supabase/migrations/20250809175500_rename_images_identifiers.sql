-- Rename constraints, indexes, triggers, and policy names from images → uploaded_images
-- Assumes table public.uploaded_images already exists (renamed earlier)

BEGIN;

-- Constraints
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'images_pkey'
  ) THEN
    ALTER TABLE ONLY public.uploaded_images RENAME CONSTRAINT images_pkey TO uploaded_images_pkey;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'images_user_id_fkey'
  ) THEN
    ALTER TABLE ONLY public.uploaded_images RENAME CONSTRAINT images_user_id_fkey TO uploaded_images_user_id_fkey;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_images_character_id'
  ) THEN
    ALTER TABLE ONLY public.uploaded_images RENAME CONSTRAINT fk_images_character_id TO fk_uploaded_images_character_id;
  END IF;
END $$;

-- Indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_images_face_model_id'
  ) THEN
    ALTER INDEX idx_images_face_model_id RENAME TO idx_uploaded_images_face_model_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_images_character_id'
  ) THEN
    ALTER INDEX idx_images_character_id RENAME TO idx_uploaded_images_character_id;
  END IF;
END $$;

-- Trigger: rename if exists (legacy trigger name)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_images_updated_at'
  ) THEN
    ALTER TRIGGER update_images_updated_at ON public.uploaded_images RENAME TO update_uploaded_images_updated_at;
  END IF;
END $$;

-- RLS policy names (rename policy identifier; body already attached to the table after rename)
-- Note: Policy names are not schema-qualified in catalogs, so we use dynamic SQL guarded by existence
DO $$
DECLARE
  policy_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'uploaded_images'
      AND policyname = 'Users can manage their own images'
  ) INTO policy_exists;
  IF policy_exists THEN
    ALTER POLICY "Users can manage their own images" ON public.uploaded_images
      RENAME TO "Users can manage their own uploaded images";
  END IF;
END $$;

COMMIT;