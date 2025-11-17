-- Migration: Make Stripe columns nullable for Free plans
-- Description: Free plans don't have Stripe subscriptions, so Stripe-related columns must be nullable
-- Date: 2025-11-17

-- Make all Stripe-related columns nullable
ALTER TABLE user_subscriptions 
ALTER COLUMN stripe_subscription_id DROP NOT NULL,
ALTER COLUMN stripe_customer_id DROP NOT NULL,
ALTER COLUMN stripe_price_id DROP NOT NULL;

-- Add comments
COMMENT ON COLUMN user_subscriptions.stripe_subscription_id IS 
'Stripe subscription ID. NULL for free plans that are not managed by Stripe.';

COMMENT ON COLUMN user_subscriptions.stripe_customer_id IS 
'Stripe customer ID. NULL for free plans that are not managed by Stripe.';

COMMENT ON COLUMN user_subscriptions.stripe_price_id IS 
'Stripe price ID. NULL for free plans that are not managed by Stripe.';

