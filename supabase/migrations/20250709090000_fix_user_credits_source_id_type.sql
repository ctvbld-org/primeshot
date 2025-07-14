-- Migration: Fix user_credits.source_id type (UUID -> TEXT)
-- This migration reverts source_id to TEXT to support Stripe IDs and UUIDs

ALTER TABLE user_credits ALTER COLUMN source_id TYPE TEXT USING source_id::text;

COMMENT ON COLUMN user_credits.source_id IS 'ID of the source for this credit transaction (Stripe subscription/payment intent or UUID for internal sources)'; 