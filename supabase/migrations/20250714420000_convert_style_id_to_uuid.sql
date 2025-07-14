-- Migration: Convert style_id columns to uuid and add foreign key constraint
-- Date: 2025-07-14
-- Purpose: 
-- 1. Convert styles.id from text to uuid
-- 2. Convert inference_jobs.style_id from text to uuid 
-- 3. Add foreign key constraint between inference_jobs.style_id and styles.id

-- Step 1: Handle ID column type conversion
-- Check if the id column is already uuid type
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'styles' AND column_name = 'id') = 'text' THEN
    -- Convert text to uuid
    ALTER TABLE "public"."styles" ADD COLUMN temp_id uuid DEFAULT gen_random_uuid();
    
    UPDATE "public"."styles" 
    SET temp_id = CASE 
      WHEN "id" IS NOT NULL AND LENGTH("id") = 36 AND "id" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
      THEN "id"::uuid 
      ELSE gen_random_uuid() 
    END;
    
    ALTER TABLE "public"."styles" DROP COLUMN "id";
    ALTER TABLE "public"."styles" RENAME COLUMN temp_id TO "id";
    ALTER TABLE "public"."styles" ADD CONSTRAINT styles_pkey PRIMARY KEY ("id");
  ELSE
    -- Column is already uuid type, no conversion needed
    RAISE NOTICE 'styles.id column is already uuid type, skipping conversion';
  END IF;
END $$;

-- Step 2: Convert inference_jobs.style_id from text to uuid
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'inference_jobs' AND column_name = 'style_id') = 'text' THEN
    -- Convert text to uuid
    UPDATE "public"."inference_jobs" 
    SET "style_id" = NULL 
    WHERE "style_id" IS NOT NULL AND ("style_id" = '' OR LENGTH("style_id") != 36 OR NOT ("style_id" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'));
    
    ALTER TABLE "public"."inference_jobs" 
    ALTER COLUMN "style_id" TYPE uuid USING CASE 
      WHEN "style_id" IS NULL OR "style_id" = '' OR LENGTH("style_id") != 36 THEN NULL 
      ELSE "style_id"::uuid 
    END;
  ELSE
    -- Column is already uuid type, no conversion needed
    RAISE NOTICE 'inference_jobs.style_id column is already uuid type, skipping conversion';
  END IF;
END $$;

-- Step 3: Add foreign key constraint
ALTER TABLE "public"."inference_jobs" 
ADD CONSTRAINT "inference_jobs_style_id_fkey" 
FOREIGN KEY ("style_id") 
REFERENCES "public"."styles"("id") 
ON DELETE SET NULL;

-- Step 4: Add index for performance
CREATE INDEX IF NOT EXISTS "idx_inference_jobs_style_id" 
ON "public"."inference_jobs" ("style_id");

-- Step 5: Update comments
COMMENT ON COLUMN "public"."inference_jobs"."style_id" IS 'Reference to the style configuration from styles table'; 