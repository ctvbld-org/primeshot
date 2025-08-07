-- Clean up characters table by removing redundant columns and renaming age_range
-- These changes consolidate physical attributes into the metadata JSONB column
-- while keeping essential fields for direct querying

-- Remove redundant columns that are now captured in metadata
ALTER TABLE characters 
DROP COLUMN IF EXISTS ethnicity,
DROP COLUMN IF EXISTS height_range;

-- Rename age_range to age for clearer naming
ALTER TABLE characters 
RENAME COLUMN age_range TO age;

-- Add comments explaining the cleanup
COMMENT ON COLUMN characters.age IS 'Age information for the character (simplified from age_range)';
COMMENT ON COLUMN characters.metadata IS 'Stores comprehensive physical characteristics including ethnicity, height, and detailed analysis from Claude API';