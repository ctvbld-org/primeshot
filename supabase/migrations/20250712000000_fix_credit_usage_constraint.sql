-- Migration: Fix credit_usage constraint to allow face_model_training
-- Updates the usage_type constraint to support the new face_model_training type
-- Replaces 'lora_training' with 'face_model_training' to match the refactoring

-- Drop the existing constraint
ALTER TABLE credit_usage DROP CONSTRAINT IF EXISTS credit_usage_usage_type_check;

-- Add new constraint that allows face_model_training instead of lora_training
ALTER TABLE credit_usage ADD CONSTRAINT credit_usage_usage_type_check 
CHECK (usage_type IN ('image_generation', 'face_model_training'));

-- Update any existing records that have 'lora_training' to 'face_model_training'
UPDATE credit_usage 
SET usage_type = 'face_model_training' 
WHERE usage_type = 'lora_training'; 