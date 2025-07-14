-- Migration: Add selection columns to inference_jobs table
-- Date: 2025-07-14
-- Purpose: Add wardrobe_id, scene_id, and color_id columns to inference_jobs
-- to track specific user selections for each inference job

-- Add columns for user selections
ALTER TABLE "public"."inference_jobs" 
ADD COLUMN "wardrobe_id" UUID REFERENCES "public"."style_wardrobes"("id") ON DELETE SET NULL,
ADD COLUMN "scene_id" UUID REFERENCES "public"."style_scenes"("id") ON DELETE SET NULL,
ADD COLUMN "color_id" UUID REFERENCES "public"."style_colors"("id") ON DELETE SET NULL;

-- Add comments for the new columns
COMMENT ON COLUMN "public"."inference_jobs"."wardrobe_id" IS 'Reference to the specific wardrobe selection for this inference job';
COMMENT ON COLUMN "public"."inference_jobs"."scene_id" IS 'Reference to the specific scene selection for this inference job';
COMMENT ON COLUMN "public"."inference_jobs"."color_id" IS 'Reference to the specific color selection for this inference job';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_inference_jobs_wardrobe_id" ON "public"."inference_jobs"("wardrobe_id");
CREATE INDEX IF NOT EXISTS "idx_inference_jobs_scene_id" ON "public"."inference_jobs"("scene_id");
CREATE INDEX IF NOT EXISTS "idx_inference_jobs_color_id" ON "public"."inference_jobs"("color_id");

-- Verify the columns were added successfully
DO $$
DECLARE
    wardrobe_column_exists boolean;
    scene_column_exists boolean;
    color_column_exists boolean;
BEGIN
    -- Check if new columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inference_jobs' AND column_name = 'wardrobe_id' AND table_schema = 'public'
    ) INTO wardrobe_column_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inference_jobs' AND column_name = 'scene_id' AND table_schema = 'public'
    ) INTO scene_column_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inference_jobs' AND column_name = 'color_id' AND table_schema = 'public'
    ) INTO color_column_exists;
    
    -- Log results
    IF wardrobe_column_exists AND scene_column_exists AND color_column_exists THEN
        RAISE NOTICE 'SUCCESS: All selection columns added to inference_jobs table';
    ELSE
        RAISE EXCEPTION 'MIGRATION FAILED: wardrobe_col=%, scene_col=%, color_col=%', 
            wardrobe_column_exists, scene_column_exists, color_column_exists;
    END IF;
END $$; 