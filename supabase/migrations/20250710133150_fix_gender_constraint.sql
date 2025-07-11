-- Fix gender constraint to accept both lowercase and capitalized values
-- This allows the form to send either 'male'/'female' or 'Male'/'Female'

-- Drop the existing constraint
ALTER TABLE face_models DROP CONSTRAINT IF EXISTS face_models_gender_check;

-- Add new constraint that accepts both cases
ALTER TABLE face_models ADD CONSTRAINT face_models_gender_check 
CHECK (gender IN ('Male', 'Female', 'male', 'female', 'MALE', 'FEMALE') OR gender IS NULL); 