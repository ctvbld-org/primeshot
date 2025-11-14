-- ============================================================================
-- Migration: Add Quota and Remaining Credits Tracking
-- Purpose: Fix subscription quota reset and purchased credit expiration issues
-- ============================================================================

-- ============================================================================
-- Part 1: Add Quota Tracking to user_subscriptions
-- ============================================================================

-- Add columns for subscription quota tracking
ALTER TABLE user_subscriptions 
  ADD COLUMN IF NOT EXISTS monthly_credits_quota INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_period_credits_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_quota_reset_at TIMESTAMP WITH TIME ZONE;

-- Initialize quota for existing active subscriptions
UPDATE user_subscriptions us
SET 
  monthly_credits_quota = COALESCE(s.credits, 0),
  current_period_credits_used = 0,
  last_quota_reset_at = COALESCE(us.current_period_start, us.created_at)
FROM subscriptions s
WHERE us.plan_name = s.name
  AND us.status = 'active'
  AND us.monthly_credits_quota IS NULL;

-- ============================================================================
-- Part 2: Add Remaining Credits to credit_pack_purchases
-- ============================================================================

-- Add column to track remaining credits from each purchase
ALTER TABLE credit_pack_purchases 
  ADD COLUMN IF NOT EXISTS remaining_credits INTEGER;

-- Initialize remaining_credits for existing purchases
UPDATE credit_pack_purchases
SET remaining_credits = credits_purchased
WHERE remaining_credits IS NULL;

-- Make it NOT NULL after initialization
ALTER TABLE credit_pack_purchases 
  ALTER COLUMN remaining_credits SET NOT NULL;

-- Add index for faster queries on active purchases
CREATE INDEX IF NOT EXISTS idx_credit_pack_purchases_active 
  ON credit_pack_purchases(user_id, expires_at) 
  WHERE status = 'completed' AND remaining_credits > 0;

-- ============================================================================
-- Part 3: Helper Functions
-- ============================================================================

-- Function: Get available credits breakdown
CREATE OR REPLACE FUNCTION get_available_credits(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_subscription_available INTEGER := 0;
  v_purchased_available INTEGER := 0;
BEGIN
  -- Get subscription quota remaining
  SELECT 
    GREATEST(monthly_credits_quota - current_period_credits_used, 0)
  INTO v_subscription_available
  FROM user_subscriptions
  WHERE user_id = p_user_id 
    AND status = 'active'
  LIMIT 1;
  
  -- Get purchased credits remaining (non-expired)
  SELECT 
    COALESCE(SUM(remaining_credits), 0)
  INTO v_purchased_available
  FROM credit_pack_purchases
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND expires_at > NOW()
    AND remaining_credits > 0;
  
  RETURN jsonb_build_object(
    'total', COALESCE(v_subscription_available, 0) + v_purchased_available,
    'subscription', COALESCE(v_subscription_available, 0),
    'purchased', v_purchased_available
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reset subscription quota (monthly renewal)
CREATE OR REPLACE FUNCTION reset_subscription_quota(
  p_subscription_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_quota INTEGER;
  v_plan_name TEXT;
BEGIN
  -- Get subscription info
  SELECT 
    us.user_id,
    us.plan_name,
    COALESCE(s.credits, 0)
  INTO v_user_id, v_plan_name, v_quota
  FROM user_subscriptions us
  LEFT JOIN subscriptions s ON s.name = us.plan_name
  WHERE us.stripe_subscription_id = p_subscription_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Subscription not found'
    );
  END IF;
  
  -- Reset the quota
  UPDATE user_subscriptions
  SET 
    current_period_credits_used = 0,
    monthly_credits_quota = v_quota,
    last_quota_reset_at = NOW(),
    updated_at = NOW()
  WHERE stripe_subscription_id = p_subscription_id;
  
  -- Log the reset in user_credits (for audit trail)
  INSERT INTO user_credits (
    user_id,
    credits,
    transaction_type,
    source_type,
    source_id,
    description,
    metadata
  ) VALUES (
    v_user_id,
    0,  -- No credits added, just logging the reset
    'earned',
    'subscription',
    p_subscription_id,
    'Monthly quota reset - ' || v_plan_name,
    jsonb_build_object(
      'action', 'quota_reset',
      'quota', v_quota,
      'reset_at', NOW()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'quota', v_quota,
    'message', 'Quota reset successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Deduct credits (smart priority: subscription first, then purchased)
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Credit usage'
)
RETURNS JSONB AS $$
DECLARE
  v_subscription RECORD;
  v_purchase RECORD;
  v_from_subscription INTEGER := 0;
  v_from_purchased INTEGER := 0;
  v_remaining INTEGER := p_amount;
BEGIN
  -- Check if we have enough credits
  IF (get_available_credits(p_user_id)->>'total')::INTEGER < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits'
    );
  END IF;
  
  -- Priority 1: Use subscription quota first
  SELECT 
    id,
    monthly_credits_quota,
    current_period_credits_used
  INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id 
    AND status = 'active'
  LIMIT 1
  FOR UPDATE;
  
  IF FOUND AND v_subscription.monthly_credits_quota > 0 THEN
    v_from_subscription := LEAST(
      v_remaining, 
      v_subscription.monthly_credits_quota - v_subscription.current_period_credits_used
    );
    
    IF v_from_subscription > 0 THEN
      UPDATE user_subscriptions
      SET 
        current_period_credits_used = current_period_credits_used + v_from_subscription,
        updated_at = NOW()
      WHERE id = v_subscription.id;
      
      v_remaining := v_remaining - v_from_subscription;
    END IF;
  END IF;
  
  -- Priority 2: Use purchased credits (FIFO - oldest expires first)
  IF v_remaining > 0 THEN
    FOR v_purchase IN (
      SELECT id, remaining_credits
      FROM credit_pack_purchases
      WHERE user_id = p_user_id
        AND status = 'completed'
        AND expires_at > NOW()
        AND remaining_credits > 0
      ORDER BY expires_at ASC  -- Use oldest first
      FOR UPDATE
    ) LOOP
      DECLARE
        v_to_deduct INTEGER := LEAST(v_remaining, v_purchase.remaining_credits);
      BEGIN
        UPDATE credit_pack_purchases
        SET 
          remaining_credits = remaining_credits - v_to_deduct,
          updated_at = NOW()
        WHERE id = v_purchase.id;
        
        v_from_purchased := v_from_purchased + v_to_deduct;
        v_remaining := v_remaining - v_to_deduct;
        
        EXIT WHEN v_remaining = 0;
      END;
    END LOOP;
  END IF;
  
  -- Log the transaction
  INSERT INTO user_credits (
    user_id,
    credits,
    transaction_type,
    source_type,
    description,
    metadata
  ) VALUES (
    p_user_id,
    -p_amount,
    'spent',
    'usage',
    p_description,
    jsonb_build_object(
      'from_subscription', v_from_subscription,
      'from_purchased', v_from_purchased
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'deducted', p_amount,
    'breakdown', jsonb_build_object(
      'subscription', v_from_subscription,
      'purchased', v_from_purchased
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Expire old purchased credits (cron job)
CREATE OR REPLACE FUNCTION expire_old_purchased_credits()
RETURNS JSONB AS $$
DECLARE
  v_purchase RECORD;
  v_total_expired INTEGER := 0;
  v_batches_expired INTEGER := 0;
BEGIN
  FOR v_purchase IN (
    SELECT 
      id,
      user_id,
      remaining_credits,
      created_at,
      stripe_payment_intent_id
    FROM credit_pack_purchases
    WHERE expires_at <= NOW()
      AND status = 'completed'
      AND remaining_credits > 0
    FOR UPDATE
  ) LOOP
    -- Log the expiration (ONLY remaining credits, not the full amount)
    INSERT INTO user_credits (
      user_id,
      credits,
      transaction_type,
      source_type,
      source_id,
      description,
      metadata
    ) VALUES (
      v_purchase.user_id,
      -v_purchase.remaining_credits,  -- Only expire what's left!
      'expired',
      'credit_pack',
      v_purchase.stripe_payment_intent_id,
      'Purchased credits expired (unused)',
      jsonb_build_object(
        'purchase_id', v_purchase.id,
        'purchased_at', v_purchase.created_at,
        'expired_amount', v_purchase.remaining_credits
      )
    );
    
    -- Mark credits as expired
    UPDATE credit_pack_purchases
    SET 
      remaining_credits = 0,
      updated_at = NOW()
    WHERE id = v_purchase.id;
    
    v_total_expired := v_total_expired + v_purchase.remaining_credits;
    v_batches_expired := v_batches_expired + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'expired_credits', v_total_expired,
    'batches_expired', v_batches_expired,
    'processed_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Part 4: Update existing process_credit_pack_purchase function
-- ============================================================================

CREATE OR REPLACE FUNCTION process_credit_pack_purchase(
  p_user_id UUID, 
  p_payment_intent_id TEXT, 
  p_price_id TEXT, 
  p_credits INTEGER, 
  p_amount_paid INTEGER, 
  p_expires_at TIMESTAMP WITH TIME ZONE, 
  p_description TEXT, 
  p_metadata JSONB
)
RETURNS VOID AS $$
BEGIN
  -- Check for duplicate (idempotency)
  IF EXISTS (
    SELECT 1 FROM credit_pack_purchases 
    WHERE stripe_payment_intent_id = p_payment_intent_id
  ) THEN
    RAISE NOTICE 'Credit pack purchase already processed: %', p_payment_intent_id;
    RETURN;
  END IF;
  
  -- Record purchase WITH remaining_credits initialized
  INSERT INTO credit_pack_purchases (
    user_id, 
    stripe_payment_intent_id, 
    stripe_price_id,
    credits_purchased, 
    remaining_credits,  -- NEW: Initialize to full amount
    amount_paid, 
    status, 
    expires_at
  ) VALUES (
    p_user_id, 
    p_payment_intent_id, 
    p_price_id,
    p_credits, 
    p_credits,  -- NEW: Same as purchased initially
    p_amount_paid, 
    'completed', 
    p_expires_at
  );
  
  -- Log credit award (for audit trail)
  INSERT INTO user_credits (
    user_id, 
    credits, 
    transaction_type, 
    source_type,
    source_id, 
    expires_at, 
    description, 
    metadata
  ) VALUES (
    p_user_id, 
    p_credits, 
    'earned', 
    'credit_pack',
    p_payment_intent_id, 
    p_expires_at, 
    p_description, 
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Part 5: Update calculate_user_credit_balance to use new system
-- ============================================================================

-- Replace old balance calculation with new system
CREATE OR REPLACE FUNCTION calculate_user_credit_balance(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance JSONB;
BEGIN
  -- Use the new get_available_credits function
  SELECT get_available_credits(user_uuid) INTO v_balance;
  
  -- Return total available credits
  RETURN COALESCE((v_balance->>'total')::INTEGER, 0);
END;
$$;

COMMENT ON FUNCTION calculate_user_credit_balance(UUID) IS 
  'Legacy function maintained for API compatibility. Now uses get_available_credits internally.';

-- ============================================================================
-- Part 6: Replace old spend_user_credits with compatibility wrapper
-- ============================================================================

-- Drop old function signatures
DROP FUNCTION IF EXISTS spend_user_credits(UUID, INTEGER, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS spend_user_credits(UUID, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS spend_user_credits(UUID, INTEGER, TEXT);

-- Create compatibility wrapper that uses new deduct_credits
CREATE OR REPLACE FUNCTION spend_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_usage_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(success BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_quality TEXT := NULL;
  v_nb_takes INTEGER := NULL;
  v_job_id UUID := NULL;
BEGIN
  -- Call new deduct_credits function
  SELECT deduct_credits(
    p_user_id,
    p_amount,
    COALESCE(p_description, p_usage_type)
  ) INTO v_result;
  
  -- Check if deduction was successful
  IF NOT (v_result->>'success')::BOOLEAN THEN
    RAISE EXCEPTION '%', COALESCE(v_result->>'error', 'Failed to deduct credits');
  END IF;
  
  -- Log usage in credit_usage table for analytics
  v_quality := NULLIF(p_metadata->>'quality', '');
  v_nb_takes := (NULLIF(p_metadata->>'nb_takes', ''))::INTEGER;
  v_job_id := (NULLIF(p_metadata->>'job_id', ''))::UUID;
  
  INSERT INTO credit_usage (
    user_id,
    credits_used,
    usage_type,
    quality,
    nb_takes,
    job_id,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    p_usage_type,
    v_quality,
    v_nb_takes,
    v_job_id,
    COALESCE(p_metadata, '{}'::jsonb)
  );
  
  -- Return success
  RETURN QUERY SELECT TRUE;
END;
$$;

COMMENT ON FUNCTION spend_user_credits(UUID, INTEGER, TEXT, TEXT, JSONB) IS 
  'Legacy function maintained for API compatibility. Now uses deduct_credits internally.';

-- ============================================================================
-- Part 7: Replace spend_credits_with_job_tracking
-- ============================================================================

-- Drop old function
DROP FUNCTION IF EXISTS spend_credits_with_job_tracking(UUID, INTEGER, TEXT, UUID, TEXT, JSONB);

-- Create new version using new deduct_credits
CREATE OR REPLACE FUNCTION spend_credits_with_job_tracking(
  p_user_id UUID,
  p_amount INTEGER,
  p_usage_type TEXT,
  p_job_id UUID,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  success BOOLEAN,
  final_balance INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_initial_balance INTEGER;
  v_final_balance INTEGER;
  v_result JSONB;
BEGIN
  -- Get initial balance
  SELECT (get_available_credits(p_user_id)->>'total')::INTEGER 
  INTO v_initial_balance;
  
  -- Check if user has enough credits
  IF v_initial_balance < p_amount THEN
    RETURN QUERY SELECT FALSE, v_initial_balance, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;
  
  -- Deduct credits using new system
  SELECT deduct_credits(
    p_user_id,
    p_amount,
    COALESCE(p_description, p_usage_type)
  ) INTO v_result;
  
  IF NOT (v_result->>'success')::BOOLEAN THEN
    RETURN QUERY SELECT FALSE, v_initial_balance, (v_result->>'error')::TEXT;
    RETURN;
  END IF;
  
  -- Get final balance
  SELECT (get_available_credits(p_user_id)->>'total')::INTEGER 
  INTO v_final_balance;
  
  -- Log usage with job tracking
  INSERT INTO credit_usage (
    user_id,
    credits_used,
    usage_type,
    job_id,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    p_usage_type,
    p_job_id,
    p_metadata || jsonb_build_object('job_id', p_job_id)
  );
  
  -- Return success
  RETURN QUERY SELECT TRUE, v_final_balance, NULL::TEXT;
  
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'spend_credits_with_job_tracking error for user % job %: %', 
    p_user_id, p_job_id, SQLERRM;
  RETURN QUERY SELECT FALSE, COALESCE(v_initial_balance, 0), SQLERRM;
END;
$$;

COMMENT ON FUNCTION spend_credits_with_job_tracking(UUID, INTEGER, TEXT, UUID, TEXT, JSONB) IS 
  'Legacy function for job tracking. Now uses deduct_credits internally.';

-- ============================================================================
-- Part 8: Update refund_credits_with_idempotency for new system
-- ============================================================================

-- Drop old function and create new one compatible with quota system
DROP FUNCTION IF EXISTS refund_credits_with_idempotency(UUID, UUID, INTEGER, TEXT, TEXT);

CREATE OR REPLACE FUNCTION refund_credits_with_idempotency(
  p_user_id UUID,
  p_job_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_idempotency_key TEXT
)
RETURNS TABLE(success BOOLEAN, refund_created BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_refund_count INTEGER;
  v_subscription_id TEXT;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_refund_type TEXT;
BEGIN
  -- Check if refund already exists with this idempotency key
  SELECT COUNT(*) INTO existing_refund_count
  FROM user_credits 
  WHERE user_id = p_user_id 
    AND source_type = 'refund'
    AND source_id = p_job_id::TEXT
    AND metadata->>'idempotency_key' = p_idempotency_key;
  
  -- If refund already exists, return success but indicate no new refund created
  IF existing_refund_count > 0 THEN
    RETURN QUERY SELECT TRUE, FALSE, 'Refund already processed'::TEXT;
    RETURN;
  END IF;
  
  -- NEW: Refund credits using the new quota system
  -- Try to find active subscription in current period
  SELECT subscription_id, current_period_start, current_period_end
  INTO v_subscription_id, v_period_start, v_period_end
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND current_period_end > NOW()
  LIMIT 1;
  
  IF v_subscription_id IS NOT NULL THEN
    -- Refund to subscription quota (reduce used credits)
    UPDATE user_subscriptions
    SET current_period_credits_used = GREATEST(0, current_period_credits_used - p_amount)
    WHERE subscription_id = v_subscription_id;
    
    v_refund_type := 'subscription';
    
    RAISE LOG 'Refunded % credits to subscription quota for user %', p_amount, p_user_id;
  ELSE
    -- No active subscription, add as purchased credits (90-day expiry)
    INSERT INTO credit_pack_purchases (
      user_id,
      stripe_payment_intent_id,
      credits_purchased,
      remaining_credits,
      price_paid,
      purchased_at,
      expires_at,
      status,
      metadata
    ) VALUES (
      p_user_id,
      NULL,  -- No Stripe payment for refunds
      p_amount,
      p_amount,
      0,
      NOW(),
      NOW() + INTERVAL '90 days',
      'completed',
      jsonb_build_object(
        'source', 'refund',
        'job_id', p_job_id,
        'reason', p_reason,
        'idempotency_key', p_idempotency_key
      )
    );
    
    v_refund_type := 'purchased';
    
    RAISE LOG 'Refunded % credits as purchased credits for user %', p_amount, p_user_id;
  END IF;
  
  -- Log in user_credits for audit trail (kept for historical tracking)
  INSERT INTO user_credits (
    user_id,
    credits,
    transaction_type,
    source_type,
    source_id,
    description,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    'earned',
    'refund',
    p_job_id::TEXT,
    p_reason,
    jsonb_build_object(
      'original_job_id', p_job_id,
      'reason', p_reason,
      'idempotency_key', p_idempotency_key,
      'refund_type', v_refund_type
    )
  );
  
  RETURN QUERY SELECT TRUE, TRUE, NULL::TEXT;
  
EXCEPTION WHEN unique_violation THEN
  -- Handle race condition where another process created the same refund
  RETURN QUERY SELECT TRUE, FALSE, 'Concurrent refund already processed'::TEXT;
WHEN OTHERS THEN
  RAISE LOG 'refund_credits_with_idempotency error for user % job %: %', p_user_id, p_job_id, SQLERRM;
  RETURN QUERY SELECT FALSE, FALSE, SQLERRM;
END;
$$;

COMMENT ON FUNCTION refund_credits_with_idempotency(UUID, UUID, INTEGER, TEXT, TEXT) IS 
  'Refunds credits for failed jobs. Now compatible with quota system - refunds to subscription quota if active, otherwise creates purchased credit batch.';

-- ============================================================================
-- Part 9: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_available_credits(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION reset_subscription_quota(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION expire_old_purchased_credits() TO service_role;
GRANT EXECUTE ON FUNCTION process_credit_pack_purchase(UUID, TEXT, TEXT, INTEGER, INTEGER, TIMESTAMP WITH TIME ZONE, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION calculate_user_credit_balance(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION spend_user_credits(UUID, INTEGER, TEXT, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION spend_credits_with_job_tracking(UUID, INTEGER, TEXT, UUID, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION refund_credits_with_idempotency(UUID, UUID, INTEGER, TEXT, TEXT) TO authenticated, service_role;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Next Steps:
-- 1. Update webhook handler to call reset_subscription_quota() on renewal
-- 2. Update image generation code to call deduct_credits()
-- 3. Set up cron job for expire_old_purchased_credits() (daily)
-- 4. Update monthly credits cron to use reset_subscription_quota()
-- ============================================================================

