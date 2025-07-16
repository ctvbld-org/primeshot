-- Remove reference columns that were incorrectly added to styles table
-- These columns should not exist on the styles table as they represent user selections
-- and belong on inference_jobs instead

-- Drop the reference columns from styles table
ALTER TABLE "public"."styles" 
DROP COLUMN IF EXISTS "wardrobe_id",
DROP COLUMN IF EXISTS "scene_id", 
DROP COLUMN IF EXISTS "color_id"; 