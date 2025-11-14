-- ============================================================================
-- Fix deduct_credits function to use valid source_type
-- ============================================================================
-- Issue: source_type = 'usage' is not allowed by CHECK constraint
-- Allowed values: 'subscription', 'credit_pack', 'refund', 'admin', 'inference'
-- ============================================================================

-- Drop the function first to handle signature changes
DROP FUNCTION IF EXISTS deduct_credits(UUID, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_subscription RECORD;
  v_purchase RECORD;
  v_remaining INTEGER := p_amount;
  v_from_subscription INTEGER := 0;
  v_from_purchased INTEGER := 0;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Amount must be positive'
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
  -- FIXED: Changed source_type from 'usage' to 'inference' (valid value)
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
    'inference',  -- FIXED: Was 'usage', now 'inference'
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

COMMENT ON FUNCTION deduct_credits(UUID, INTEGER, TEXT) IS 
  'Deduct credits from user (subscription quota first, then purchased credits FIFO). Fixed to use source_type=inference instead of usage.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER, TEXT) TO authenticated, service_role;

