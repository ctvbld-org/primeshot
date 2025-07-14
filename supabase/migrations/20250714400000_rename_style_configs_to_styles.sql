-- Migration: Rename style_configs to styles and add reference columns
-- Date: 2025-07-14
-- Purpose: 
-- 1. Drop obsolete styles table (from order-based system)
-- 2. Rename style_configs to styles (predefined style templates)
-- 3. Add reference columns for user selections (wardrobe_id, scene_id, color_id)

-- Step 1: Drop the obsolete styles table
-- This table was used for user-created style configurations in the order-based system
-- It's no longer needed as the system now uses subscriptions
DROP TABLE IF EXISTS "public"."styles" CASCADE;

-- Step 2: Rename style_configs to styles
-- This makes the naming more intuitive - styles are the predefined templates
ALTER TABLE "public"."style_configs" RENAME TO "styles";

-- Step 3: Add reference columns for user selections
-- These will allow inference_jobs to reference specific wardrobe, scene, and color choices
ALTER TABLE "public"."styles" 
ADD COLUMN "wardrobe_id" UUID REFERENCES "public"."style_wardrobes"("id"),
ADD COLUMN "scene_id" UUID REFERENCES "public"."style_scenes"("id"),
ADD COLUMN "color_id" UUID REFERENCES "public"."style_colors"("id");

-- Step 4: Update table comments
COMMENT ON TABLE "public"."styles" IS 'Stores predefined style templates for photo generation';
COMMENT ON COLUMN "public"."styles"."wardrobe_id" IS 'Reference to default wardrobe selection for this style';
COMMENT ON COLUMN "public"."styles"."scene_id" IS 'Reference to default scene selection for this style';
COMMENT ON COLUMN "public"."styles"."color_id" IS 'Reference to default color selection for this style';

-- Step 5: Update the primary key constraint name
ALTER TABLE "public"."styles" DROP CONSTRAINT IF EXISTS "style_configs_pkey";
ALTER TABLE "public"."styles" ADD CONSTRAINT "styles_pkey" PRIMARY KEY ("id");

-- Step 6: Update the updated_at trigger
DROP TRIGGER IF EXISTS "update_style_configs_updated_at" ON "public"."styles";
CREATE OR REPLACE TRIGGER "update_styles_updated_at" 
    BEFORE UPDATE ON "public"."styles" 
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Step 7: Update RLS policies
-- Drop old style_configs policies
DROP POLICY IF EXISTS "Allow public read access to style_configs" ON "public"."styles";
DROP POLICY IF EXISTS "Public read access" ON "public"."styles";

-- Create new styles policies
CREATE POLICY "Allow public read access to styles"
ON "public"."styles"
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Public read access"
ON "public"."styles"
FOR SELECT
TO authenticated, anon
USING (true);

-- Step 8: Create indexes for the new reference columns
CREATE INDEX IF NOT EXISTS "idx_styles_wardrobe_id" ON "public"."styles"("wardrobe_id");
CREATE INDEX IF NOT EXISTS "idx_styles_scene_id" ON "public"."styles"("scene_id");
CREATE INDEX IF NOT EXISTS "idx_styles_color_id" ON "public"."styles"("color_id");

-- Step 9: Verify the migration was successful
DO $$
DECLARE
    styles_table_exists boolean;
    style_configs_table_exists boolean;
    wardrobe_column_exists boolean;
    scene_column_exists boolean;
    color_column_exists boolean;
BEGIN
    -- Check if styles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'styles' AND table_schema = 'public'
    ) INTO styles_table_exists;
    
    -- Check if style_configs table still exists (should be false)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'style_configs' AND table_schema = 'public'
    ) INTO style_configs_table_exists;
    
    -- Check if new columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'wardrobe_id' AND table_schema = 'public'
    ) INTO wardrobe_column_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'scene_id' AND table_schema = 'public'
    ) INTO scene_column_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'styles' AND column_name = 'color_id' AND table_schema = 'public'
    ) INTO color_column_exists;
    
    -- Log results
    IF styles_table_exists AND NOT style_configs_table_exists AND 
       wardrobe_column_exists AND scene_column_exists AND color_column_exists THEN
        RAISE NOTICE 'SUCCESS: style_configs renamed to styles with all reference columns added';
    ELSE
        RAISE EXCEPTION 'MIGRATION FAILED: styles_table_exists=%, style_configs_exists=%, wardrobe_col=%, scene_col=%, color_col=%', 
            styles_table_exists, style_configs_table_exists, wardrobe_column_exists, scene_column_exists, color_column_exists;
    END IF;
END $$; 