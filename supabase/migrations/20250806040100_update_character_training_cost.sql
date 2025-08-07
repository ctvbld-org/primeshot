-- Update credit cost type from FACE_MODEL_TRAINING to CHARACTER_TRAINING
-- This fixes the mismatch between the database entry and the API code

UPDATE credit_costs 
SET type = 'CHARACTER_TRAINING' 
WHERE type = 'FACE_MODEL_TRAINING';