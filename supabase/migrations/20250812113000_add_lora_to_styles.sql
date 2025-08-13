-- Migration: Add nullable lora column to styles
-- Date: 2025-08-12

ALTER TABLE public.styles
  ADD COLUMN IF NOT EXISTS lora TEXT;

COMMENT ON COLUMN public.styles.lora IS 'Optional LoRA reference (e.g., S3 key or filename).';


