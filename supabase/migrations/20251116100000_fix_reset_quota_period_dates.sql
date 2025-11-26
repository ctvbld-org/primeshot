-- ============================================================================
-- FIX: Update reset_subscription_quota to also update period dates
-- ============================================================================
-- This ensures period dates are kept in sync when quota resets happen
-- ============================================================================

DROP FUNCTION IF EXISTS reset_subscription_quota(TEXT);

CREATE OR REPLACE FUNCTION reset_subscription_quota(
  p_subscription_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_quota INTEGER;
  v_plan_name TEXT;
  v_stripe_sub_data JSONB;
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
  
  -- FIXED: Update period dates by adding 1 month to current period
  -- This ensures the cron doesn't keep resetting the same subscription
  UPDATE user_subscriptions
  SET 
    current_period_credits_used = 0,
    monthly_credits_quota = v_quota,
    last_quota_reset_at = NOW(),
    current_period_start = COALESCE(current_period_end, NOW()),  -- New period starts when old ended
    current_period_end = COALESCE(current_period_end, NOW()) + INTERVAL '1 month',  -- Move forward 1 month
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

COMMENT ON FUNCTION reset_subscription_quota(TEXT) IS 
  'Resets monthly credit quota and advances period dates by 1 month';

-- Grant permissions
GRANT EXECUTE ON FUNCTION reset_subscription_quota(TEXT) TO authenticated, service_role;



