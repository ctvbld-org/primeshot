-- Migration: Remove foreign key constraint on explore_images.generated_image_id
-- 
-- Reason: Explore images are synced between environments (local → staging → production)
-- where the referenced generated_images records don't exist. The generated_image_id
-- field is still needed for duplicate detection (UNIQUE constraint) but should not
-- enforce referential integrity since it's a cross-environment reference.
--
-- Impact:
-- - Allows syncing explore images without requiring generated_images to exist in target
-- - Maintains UNIQUE constraint for duplicate prevention
-- - Maintains the field value for tracking purposes
-- - Does NOT affect local admin where both tables exist

-- Drop the foreign key constraint
ALTER TABLE public.explore_images
  DROP CONSTRAINT IF EXISTS explore_images_generated_image_id_fkey;

-- Add comment explaining why there's no FK
COMMENT ON COLUMN public.explore_images.generated_image_id IS 
  'Reference to the source generated_image (for tracking only, no FK constraint to allow cross-environment sync)';

-- Note: The UNIQUE constraint on generated_image_id remains intact
-- Note: The field itself remains NOT NULL to ensure data quality

