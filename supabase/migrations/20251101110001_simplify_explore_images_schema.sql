-- Migration: Simplify explore_images table schema
-- Reason: Metadata is now parsed from s3_path filename, making separate columns redundant
-- This improves performance, reduces storage, and eliminates data duplication
--
-- IMPORTANT: After applying this migration, regenerate TypeScript types:
-- 1. In webapp: cd webapp && supabase gen types typescript --local > src/types/supabase.ts
-- 2. In admin: cd admin && supabase gen types typescript --local > src/types/supabase.ts

-- Remove redundant columns that are parsed from filename
-- Keep generated_image_id for tracking which images are in explore
ALTER TABLE public.explore_images
  DROP COLUMN IF EXISTS user_id,
  DROP COLUMN IF EXISTS inference_id,
  DROP COLUMN IF EXISTS style_id,
  DROP COLUMN IF EXISTS wardrobe_id,
  DROP COLUMN IF EXISTS scene_id,
  DROP COLUMN IF EXISTS color_id,
  DROP COLUMN IF EXISTS aspect_ratio,
  DROP COLUMN IF EXISTS resolution,
  DROP COLUMN IF EXISTS original_s3_path;

-- Add comment explaining the simplified schema
COMMENT ON TABLE public.explore_images IS 
  'Explore page showcase images. Metadata (style, wardrobe, scene, color, aspect ratio, resolution) is parsed from s3_path filename. generated_image_id tracks source image.';

-- Add column comments for clarity
COMMENT ON COLUMN public.explore_images.id IS 'Primary key';
COMMENT ON COLUMN public.explore_images.generated_image_id IS 'Foreign key to generated_images - tracks which generated image is showcased in explore';
COMMENT ON COLUMN public.explore_images.s3_path IS 'S3 path containing encoded metadata in filename format: {style}__{scene}__{wardrobe}__{color}__{aspectRatio}__{resolution}.webp';
COMMENT ON COLUMN public.explore_images.category_id IS 'Foreign key to explore_categories for filtering';
COMMENT ON COLUMN public.explore_images.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN public.explore_images.updated_at IS 'Timestamp when record was last updated';

