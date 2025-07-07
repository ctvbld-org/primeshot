-- Migration: Add atomic RPC functions for webhook operations
-- This ensures payment processing operations are atomic to prevent data inconsistencies

-- 1. Atomic Subscription Credit Awarding Function
CREATE OR REPLACE FUNCTION award_subscription_credits(
  p_user_id uuid,
  p_subscription_id text,
  p_credits integer,
  p_expires_at timestamptz,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_description text,
  p_metadata jsonb
) RETURNS void AS $$
BEGIN
  -- Update subscription periods atomically
  UPDATE user_subscriptions 
  SET 
    current_period_start = p_period_start,
    current_period_end = p_period_end,
    updated_at = now()
  WHERE stripe_subscription_id = p_subscription_id;
  
  -- Verify the update affected exactly one row
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;
  
  -- Award credits atomically in same transaction
  INSERT INTO user_credits (
    user_id, credits, transaction_type, source_type, 
    source_id, expires_at, description, metadata
  ) VALUES (
    p_user_id, p_credits, 'earned', 'subscription',
    p_subscription_id, p_expires_at, p_description, p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atomic Credit Pack Purchase Function
CREATE OR REPLACE FUNCTION process_credit_pack_purchase(
  p_user_id uuid,
  p_payment_intent_id text,
  p_price_id text,
  p_credits integer,
  p_amount_paid integer,
  p_expires_at timestamptz,
  p_description text,
  p_metadata jsonb
) RETURNS void AS $$
BEGIN
  -- Check for duplicate processing (idempotency)
  IF EXISTS (
    SELECT 1 FROM credit_pack_purchases 
    WHERE stripe_payment_intent_id = p_payment_intent_id
  ) THEN
    RAISE NOTICE 'Credit pack purchase already processed: %', p_payment_intent_id;
    RETURN;
  END IF;
  
  -- Record purchase
  INSERT INTO credit_pack_purchases (
    user_id, stripe_payment_intent_id, stripe_price_id,
    credits_purchased, amount_paid, status, expires_at
  ) VALUES (
    p_user_id, p_payment_intent_id, p_price_id,
    p_credits, p_amount_paid, 'completed', p_expires_at
  );
  
  -- Award credits atomically
  INSERT INTO user_credits (
    user_id, credits, transaction_type, source_type,
    source_id, expires_at, description, metadata
  ) VALUES (
    p_user_id, p_credits, 'earned', 'credit_pack',
    p_payment_intent_id, p_expires_at, p_description, p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atomic Subscription Upsert Function
CREATE OR REPLACE FUNCTION upsert_subscription(
  p_user_id uuid,
  p_stripe_subscription_id text,
  p_stripe_customer_id text,
  p_stripe_price_id text,
  p_plan_name text,
  p_status text,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean
) RETURNS void AS $$
BEGIN
  INSERT INTO user_subscriptions (
    user_id, stripe_subscription_id, stripe_customer_id,
    stripe_price_id, plan_name, status, current_period_start,
    current_period_end, cancel_at_period_end, updated_at
  ) VALUES (
    p_user_id, p_stripe_subscription_id, p_stripe_customer_id,
    p_stripe_price_id, p_plan_name, p_status, p_current_period_start,
    p_current_period_end, p_cancel_at_period_end, now()
  )
  ON CONFLICT (stripe_subscription_id) 
  DO UPDATE SET
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_price_id = EXCLUDED.stripe_price_id,
    plan_name = EXCLUDED.plan_name,
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant permissions to service role
GRANT EXECUTE ON FUNCTION award_subscription_credits(uuid, text, integer, timestamptz, timestamptz, timestamptz, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION process_credit_pack_purchase(uuid, text, text, integer, integer, timestamptz, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION upsert_subscription(uuid, text, text, text, text, text, timestamptz, timestamptz, boolean) TO service_role;

-- 5. Create indexes for performance (if not already exist)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_credit_pack_purchases_payment_intent_id ON credit_pack_purchases(stripe_payment_intent_id);

-- 6. Add comments for documentation
COMMENT ON FUNCTION award_subscription_credits IS 'Atomically updates subscription periods and awards credits for subscription renewals';
COMMENT ON FUNCTION process_credit_pack_purchase IS 'Atomically records credit pack purchase and awards credits with idempotency protection';
COMMENT ON FUNCTION upsert_subscription IS 'Atomically creates or updates subscription records'; 