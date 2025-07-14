-- Migration: Update style_configs column names
-- Renames available_* columns to match new table naming convention:
-- available_backgrounds → available_scenes
-- available_clothing → available_wardrobes
-- available_clothing_colors → available_colors

-- Rename the columns in style_configs table
ALTER TABLE style_configs 
RENAME COLUMN available_backgrounds TO available_scenes;

ALTER TABLE style_configs 
RENAME COLUMN available_clothing TO available_wardrobes;

ALTER TABLE style_configs 
RENAME COLUMN available_clothing_colors TO available_colors;

-- Update column comments to reflect new naming
COMMENT ON COLUMN style_configs.available_scenes IS 'Array of available scene options for this style';
COMMENT ON COLUMN style_configs.available_wardrobes IS 'Array of available wardrobe options for this style';
COMMENT ON COLUMN style_configs.available_colors IS 'Array of available color options for this style';

-- Verify the column renames were successful
DO $$
DECLARE
    scenes_column_exists boolean;
    wardrobes_column_exists boolean;
    colors_column_exists boolean;
    old_backgrounds_exists boolean;
    old_clothing_exists boolean;
    old_clothing_colors_exists boolean;
BEGIN
    -- Check if new columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'style_configs' AND column_name = 'available_scenes'
    ) INTO scenes_column_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'style_configs' AND column_name = 'available_wardrobes'
    ) INTO wardrobes_column_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'style_configs' AND column_name = 'available_colors'
    ) INTO colors_column_exists;
    
    -- Check if old columns still exist (they shouldn't)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'style_configs' AND column_name = 'available_backgrounds'
    ) INTO old_backgrounds_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'style_configs' AND column_name = 'available_clothing'
    ) INTO old_clothing_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'style_configs' AND column_name = 'available_clothing_colors'
    ) INTO old_clothing_colors_exists;
    
    -- Log results
    RAISE NOTICE 'Column Rename Verification:';
    RAISE NOTICE '  available_scenes exists: %', scenes_column_exists;
    RAISE NOTICE '  available_wardrobes exists: %', wardrobes_column_exists;
    RAISE NOTICE '  available_colors exists: %', colors_column_exists;
    RAISE NOTICE '  old available_backgrounds exists: %', old_backgrounds_exists;
    RAISE NOTICE '  old available_clothing exists: %', old_clothing_exists;
    RAISE NOTICE '  old available_clothing_colors exists: %', old_clothing_colors_exists;
    
    -- Verify all new columns exist and old ones don't
    IF NOT (scenes_column_exists AND wardrobes_column_exists AND colors_column_exists) THEN
        RAISE EXCEPTION 'Not all new columns were created successfully';
    END IF;
    
    IF old_backgrounds_exists OR old_clothing_exists OR old_clothing_colors_exists THEN
        RAISE EXCEPTION 'Old columns still exist after rename';
    END IF;
    
    RAISE NOTICE 'style_configs column renames completed successfully!';
END $$; 