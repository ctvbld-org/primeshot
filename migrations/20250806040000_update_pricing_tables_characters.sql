-- Migration: Update pricing tables to use "characters" terminology

-- 1. Update subscriptions table column name
ALTER TABLE "public"."subscriptions" RENAME COLUMN "max_face_models" TO "max_characters";

-- 2. Update credit_packs table column name  
ALTER TABLE "public"."credit_packs" RENAME COLUMN "face_model_training_included" TO "character_training_included";

-- 3. Update credit_costs table if it has face_model references
-- The credit_costs table uses type field with values like 'FACE_MODEL_TRAINING'
-- We'll keep this as is since it's an enum value that would require more complex migration