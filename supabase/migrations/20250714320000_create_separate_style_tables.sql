-- Migration: Create separate style tables
-- Creates style_scenes, style_wardrobes, and style_colors tables to replace the category-based style_options table
-- Each table has specific columns for its domain and proper constraints

-- Create style_scenes table
CREATE TABLE IF NOT EXISTS style_scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    image TEXT NOT NULL,
    translations JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create style_wardrobes table  
CREATE TABLE IF NOT EXISTS style_wardrobes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    image TEXT NOT NULL,
    translations JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create style_colors table
CREATE TABLE IF NOT EXISTS style_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    color TEXT NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    translations JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add table comments
COMMENT ON TABLE style_scenes IS 'Background/scene options for photo styles';
COMMENT ON TABLE style_wardrobes IS 'Clothing/wardrobe options for photo styles';
COMMENT ON TABLE style_colors IS 'Color options for clothing in photo styles';

-- Add column comments
COMMENT ON COLUMN style_scenes.value IS 'Unique identifier for the scene (e.g., plain-light, plain-dark)';
COMMENT ON COLUMN style_scenes.label IS 'Display name for the scene';
COMMENT ON COLUMN style_scenes.image IS 'Image URL for scene preview';
COMMENT ON COLUMN style_scenes.translations IS 'JSONB field containing translations for label in format: {"de": {"label": "xxx"}, "es": {"label": "xxx"}}';

COMMENT ON COLUMN style_wardrobes.value IS 'Unique identifier for the wardrobe item (e.g., shirt, polo, jacket)';
COMMENT ON COLUMN style_wardrobes.label IS 'Display name for the wardrobe item';
COMMENT ON COLUMN style_wardrobes.image IS 'Image URL for wardrobe preview';
COMMENT ON COLUMN style_wardrobes.translations IS 'JSONB field containing translations for label in format: {"de": {"label": "xxx"}, "es": {"label": "xxx"}}';

COMMENT ON COLUMN style_colors.value IS 'Unique identifier for the color (e.g., black, white, blue)';
COMMENT ON COLUMN style_colors.label IS 'Display name for the color';
COMMENT ON COLUMN style_colors.color IS 'Hex color code (e.g., #000000, #FFFFFF)';
COMMENT ON COLUMN style_colors.translations IS 'JSONB field containing translations for label in format: {"de": {"label": "xxx"}, "es": {"label": "xxx"}}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_style_scenes_value ON style_scenes(value);
CREATE INDEX IF NOT EXISTS idx_style_wardrobes_value ON style_wardrobes(value);
CREATE INDEX IF NOT EXISTS idx_style_colors_value ON style_colors(value);

-- Create indexes on translations for better query performance
CREATE INDEX IF NOT EXISTS idx_style_scenes_translations ON style_scenes USING gin(translations);
CREATE INDEX IF NOT EXISTS idx_style_wardrobes_translations ON style_wardrobes USING gin(translations);
CREATE INDEX IF NOT EXISTS idx_style_colors_translations ON style_colors USING gin(translations);

-- Add updated_at triggers
CREATE OR REPLACE TRIGGER update_style_scenes_updated_at 
    BEFORE UPDATE ON style_scenes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_style_wardrobes_updated_at 
    BEFORE UPDATE ON style_wardrobes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_style_colors_updated_at 
    BEFORE UPDATE ON style_colors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE style_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_wardrobes ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_colors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access (similar to style_configs)
CREATE POLICY "Allow public read access to style_scenes"
    ON style_scenes FOR SELECT 
    TO anon, authenticated 
    USING (true);

CREATE POLICY "Allow public read access to style_wardrobes"
    ON style_wardrobes FOR SELECT 
    TO anon, authenticated 
    USING (true);

CREATE POLICY "Allow public read access to style_colors"
    ON style_colors FOR SELECT 
    TO anon, authenticated 
    USING (true);

-- Grant permissions
GRANT SELECT ON style_scenes TO anon, authenticated;
GRANT SELECT ON style_wardrobes TO anon, authenticated;
GRANT SELECT ON style_colors TO anon, authenticated;

-- Grant all permissions to service_role for admin operations
GRANT ALL ON style_scenes TO service_role;
GRANT ALL ON style_wardrobes TO service_role;
GRANT ALL ON style_colors TO service_role; 