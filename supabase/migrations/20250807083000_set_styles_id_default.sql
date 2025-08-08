-- Migration: Set default UUID for styles.id
-- Fixes: INSERT failures due to null id (23502). Admin UI does not pass id explicitly.

-- Ensure pgcrypto is available for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Set default UUID on styles.id
ALTER TABLE public.styles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();


