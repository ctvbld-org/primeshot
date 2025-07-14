-- Migration: Migrate data from style_options to separate tables
-- Extracts data from the JSONB options arrays and populates the new tables

-- Migrate background options to style_scenes table
INSERT INTO style_scenes (value, label, image, translations)
SELECT 
    (option->>'id')::text as value,
    (option->>'label')::text as label,
    (option->>'imageUrl')::text as image,
    COALESCE(option->'translations', '{}') as translations
FROM style_options so,
     jsonb_array_elements(so.options) as option
WHERE so.category = 'background';

-- Migrate clothing options to style_wardrobes table
INSERT INTO style_wardrobes (value, label, image, translations)
SELECT 
    (option->>'id')::text as value,
    (option->>'label')::text as label,
    (option->>'imageUrl')::text as image,
    COALESCE(option->'translations', '{}') as translations
FROM style_options so,
     jsonb_array_elements(so.options) as option
WHERE so.category = 'clothing';

-- Migrate clothingColor options to style_colors table
INSERT INTO style_colors (value, label, color, translations)
SELECT 
    (option->>'id')::text as value,
    (option->>'label')::text as label,
    (option->>'color')::text as color,
    COALESCE(option->'translations', '{}') as translations
FROM style_options so,
     jsonb_array_elements(so.options) as option
WHERE so.category = 'clothingColor';

-- Verify migration success by checking row counts
DO $$
DECLARE
    scenes_count integer;
    wardrobes_count integer;
    colors_count integer;
    original_background_count integer;
    original_clothing_count integer;
    original_color_count integer;
BEGIN
    -- Count migrated rows
    SELECT COUNT(*) INTO scenes_count FROM style_scenes;
    SELECT COUNT(*) INTO wardrobes_count FROM style_wardrobes;
    SELECT COUNT(*) INTO colors_count FROM style_colors;
    
    -- Count original data
    SELECT COUNT(*) INTO original_background_count 
    FROM style_options so, jsonb_array_elements(so.options) as option 
    WHERE so.category = 'background';
    
    SELECT COUNT(*) INTO original_clothing_count 
    FROM style_options so, jsonb_array_elements(so.options) as option 
    WHERE so.category = 'clothing';
    
    SELECT COUNT(*) INTO original_color_count 
    FROM style_options so, jsonb_array_elements(so.options) as option 
    WHERE so.category = 'clothingColor';
    
    -- Log migration results
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '  Scenes migrated: % (expected: %)', scenes_count, original_background_count;
    RAISE NOTICE '  Wardrobes migrated: % (expected: %)', wardrobes_count, original_clothing_count;
    RAISE NOTICE '  Colors migrated: % (expected: %)', colors_count, original_color_count;
    
    -- Check if migration counts match
    IF scenes_count != original_background_count THEN
        RAISE EXCEPTION 'Scene migration count mismatch: expected %, got %', original_background_count, scenes_count;
    END IF;
    
    IF wardrobes_count != original_clothing_count THEN
        RAISE EXCEPTION 'Wardrobe migration count mismatch: expected %, got %', original_clothing_count, wardrobes_count;
    END IF;
    
    IF colors_count != original_color_count THEN
        RAISE EXCEPTION 'Color migration count mismatch: expected %, got %', original_color_count, colors_count;
    END IF;
    
    RAISE NOTICE 'Data migration completed successfully!';
END $$; 