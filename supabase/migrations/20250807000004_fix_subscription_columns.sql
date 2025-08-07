-- Migration: Fix pricing table columns to use "characters" terminology
-- This migration ensures the subscription and credit_packs tables use the correct column names

-- 1. Update subscriptions table column name (only if it exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'max_face_models'
    ) THEN
        ALTER TABLE "public"."subscriptions" RENAME COLUMN "max_face_models" TO "max_characters";
    END IF;
END $$;

-- 3. Update subscriptions table character_training_included column name (only if it exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'face_model_training_included'
    ) THEN
        ALTER TABLE "public"."subscriptions" RENAME COLUMN "face_model_training_included" TO "character_training_included";
    END IF;
END $$;

-- Add comments to the renamed columns (only if they exist)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'max_characters'
    ) THEN
        EXECUTE 'COMMENT ON COLUMN subscriptions.max_characters IS ''Maximum number of characters allowed for this subscription tier''';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'character_training_included'
    ) THEN
        EXECUTE 'COMMENT ON COLUMN subscriptions.character_training_included IS ''Number of character training sessions included in this subscription tier''';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_packs' 
        AND column_name = 'character_training_included'
    ) THEN
        EXECUTE 'COMMENT ON COLUMN credit_packs.character_training_included IS ''Number of character training sessions included in this credit pack''';
    END IF;
END $$;
