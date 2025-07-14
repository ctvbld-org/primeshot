-- Migration: Add translations columns to pricing tables
-- Adds JSONB translations columns to subscriptions and credit_packs tables
-- Following the translation format: {"de": {"name": "xxxx", "description": "xxxx"}, "es": {"name": "xxxx", "description": "xxxx"}, "en": ...}

-- Add translations column to subscriptions table
ALTER TABLE subscriptions ADD COLUMN translations JSONB DEFAULT '{}';

-- Add translations column to credit_packs table
ALTER TABLE credit_packs ADD COLUMN translations JSONB DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN subscriptions.translations IS 'JSONB field containing translations for name and description in format: {"de": {"name": "xxx", "description": "xxx"}, "es": {...}, "en": {...}}';
COMMENT ON COLUMN credit_packs.translations IS 'JSONB field containing translations for name and description in format: {"de": {"name": "xxx", "description": "xxx"}, "es": {...}, "en": {...}}'; 