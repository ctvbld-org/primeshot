-- Add short_code to explore_images for URL shortening
-- This allows explore images to use clean short URLs instead of long query strings

-- Enable pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add short_code column (nullable for backward compatibility)
ALTER TABLE explore_images 
ADD COLUMN IF NOT EXISTS short_code VARCHAR(8) UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_explore_images_short_code ON explore_images(short_code);

-- Backfill short codes for existing explore images
-- This generates unique short codes for all existing explore images
DO $$
DECLARE
  rec RECORD;
  new_code VARCHAR(8);
  attempts INT;
  max_attempts INT := 5;
  random_uuid TEXT;
BEGIN
  FOR rec IN SELECT id FROM explore_images WHERE short_code IS NULL LOOP
    attempts := 0;
    
    WHILE attempts < max_attempts LOOP
      -- Generate random code from UUID (no extensions needed)
      random_uuid := replace(gen_random_uuid()::text, '-', '');
      new_code := SUBSTRING(random_uuid FROM 1 FOR 6);
      
      -- Try to update with this code
      BEGIN
        UPDATE explore_images 
        SET short_code = new_code 
        WHERE id = rec.id AND short_code IS NULL;
        
        EXIT; -- Success, exit loop
      EXCEPTION
        WHEN unique_violation THEN
          attempts := attempts + 1;
          IF attempts >= max_attempts THEN
            RAISE NOTICE 'Failed to generate unique code for explore image %', rec.id;
          END IF;
      END;
    END LOOP;
  END LOOP;
END $$;
