-- Migration: Add gender column to style_wardrobes
-- Date: 2025-08-11
-- Purpose: Add a gender attribute for wardrobe items so UI can filter "Man" / "Woman" / "Unisex"

-- 1) Add the column if it does not exist
ALTER TABLE public.style_wardrobes
  ADD COLUMN IF NOT EXISTS gender TEXT;

-- 2) Backfill existing rows with 'unisex'
UPDATE public.style_wardrobes
SET gender = 'unisex'
WHERE gender IS NULL;

-- 3) Apply NOT NULL and DEFAULT
ALTER TABLE public.style_wardrobes
  ALTER COLUMN gender SET DEFAULT 'unisex',
  ALTER COLUMN gender SET NOT NULL;

-- 4) Add CHECK constraint to restrict allowed values (man, woman, unisex) if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_style_wardrobes_gender'
  ) THEN
    ALTER TABLE public.style_wardrobes
      ADD CONSTRAINT chk_style_wardrobes_gender CHECK (gender IN ('man','woman','unisex'));
  END IF;
END $$;

-- 5) Helpful index for filtering by gender
CREATE INDEX IF NOT EXISTS idx_style_wardrobes_gender
  ON public.style_wardrobes (gender);

-- 6) Documentation
COMMENT ON COLUMN public.style_wardrobes.gender IS 'Target gender for wardrobe item: man, woman, or unisex';


