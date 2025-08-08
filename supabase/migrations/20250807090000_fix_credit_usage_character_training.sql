-- Migration: Standardize credit_usage usage_type to 'character_training'
-- Context: Backend uses usage_type = 'character_training' for training spends
-- Action: Update constraint and existing rows to reflect the canonical value

-- 1) Drop existing usage_type CHECK constraint if present
ALTER TABLE credit_usage DROP CONSTRAINT IF EXISTS credit_usage_usage_type_check;

-- 2) Recreate constraint allowing only the canonical values
ALTER TABLE credit_usage
ADD CONSTRAINT credit_usage_usage_type_check
CHECK (usage_type IN ('image_generation', 'character_training'));

-- 3) Migrate historical rows from legacy value to canonical value
UPDATE credit_usage
SET usage_type = 'character_training'
WHERE usage_type = 'face_model_training';

-- 4) Comment for clarity
COMMENT ON COLUMN credit_usage.usage_type IS 'Type of credit usage. Allowed values: image_generation, character_training';


