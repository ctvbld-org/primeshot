-- Update award_monthly_subscription_credits to look up credits from subscriptions table
-- This removes the need to pass credits as a parameter

-- Drop the old function signature (with 5 parameters including p_credits)
DROP FUNCTION IF EXISTS award_monthly_subscription_credits(UUID, TEXT, INTEGER, INTEGER, TEXT);

-- Create new function with 4 parameters (no p_credits)
CREATE OR REPLACE FUNCTION award_monthly_subscription_credits(
  p_user_id UUID,
  p_subscription_id TEXT,
  p_month_number INTEGER,
  p_plan_name TEXT  -- Only need plan name, will look up credits
) RETURNS JSONB AS $$
DECLARE
  v_subscription_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
  v_existing_credit_id UUID;
  v_synthetic_invoice_id TEXT;
  v_credits INTEGER;  -- Will be looked up
BEGIN
  -- Get subscription start date
  SELECT created_at INTO v_subscription_start
  FROM user_subscriptions
  WHERE stripe_subscription_id = p_subscription_id;
  
  IF v_subscription_start IS NULL THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;
  
  -- Look up credits from subscriptions table based on plan name
  SELECT credits INTO v_credits
  FROM subscriptions
  WHERE name = p_plan_name;
  
  IF v_credits IS NULL THEN
    RAISE EXCEPTION 'Plan not found or has no credits configured: %', p_plan_name;
  END IF;
  
  -- Calculate period end (start + p_month_number months + 1 month)
  -- This preserves day-of-month and handles 28/29/30/31 day months correctly
  v_period_end := v_subscription_start + (p_month_number || ' months')::INTERVAL + INTERVAL '1 month';
  
  -- Create synthetic invoice ID for cron-awarded credits
  v_synthetic_invoice_id := 'cron_month_' || p_month_number || '_sub_' || p_subscription_id;
  
  -- Check if credits already awarded for this month
  SELECT id INTO v_existing_credit_id
  FROM user_credits
  WHERE source_id = p_subscription_id
    AND invoice_id = v_synthetic_invoice_id
    AND transaction_type = 'earned'
    AND source_type = 'subscription';
  
  IF v_existing_credit_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_awarded',
      'credit_id', v_existing_credit_id,
      'month_number', p_month_number,
      'credits', v_credits,
      'message', 'Credits already awarded for month ' || p_month_number
    );
  END IF;
  
  -- Update last_awarded_month tracking
  UPDATE user_subscriptions
  SET 
    last_awarded_month = GREATEST(COALESCE(last_awarded_month, 0), p_month_number),
    updated_at = NOW()
  WHERE stripe_subscription_id = p_subscription_id
    AND COALESCE(last_awarded_month, 0) < p_month_number;  -- Only update if not already awarded
  
  IF NOT FOUND THEN
    -- Month already awarded
    RETURN jsonb_build_object(
      'status', 'already_awarded',
      'month_number', p_month_number,
      'credits', v_credits,
      'message', 'Month already processed'
    );
  END IF;
  
  -- Award credits with the amount looked up from subscriptions table
  INSERT INTO user_credits (
    user_id, 
    credits, 
    transaction_type, 
    source_type, 
    source_id, 
    invoice_id,
    expires_at, 
    description, 
    metadata
  ) VALUES (
    p_user_id,
    v_credits,  -- Use looked up value
    'earned',
    'subscription',
    p_subscription_id,
    v_synthetic_invoice_id,
    v_period_end,
    'Monthly subscription credits - ' || p_plan_name || ' (Month ' || p_month_number || ')',
    jsonb_build_object(
      'month_number', p_month_number,
      'awarded_at', NOW(),
      'award_type', 'cron_job',
      'subscription_start', v_subscription_start,
      'period_end', v_period_end,
      'credits_from_plan', v_credits
    )
  )
  RETURNING id INTO v_existing_credit_id;
  
  RETURN jsonb_build_object(
    'status', 'awarded',
    'credit_id', v_existing_credit_id,
    'credits', v_credits,
    'month_number', p_month_number,
    'message', 'Monthly credits awarded successfully'
  );
  
EXCEPTION
  WHEN unique_violation THEN
    -- Another concurrent call already inserted
    RETURN jsonb_build_object(
      'status', 'already_awarded',
      'month_number', p_month_number,
      'message', 'Credits already awarded by concurrent process'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION award_monthly_subscription_credits IS 
'Awards monthly subscription credits via cron job. Looks up credit amount from subscriptions table based on plan name. No hardcoded values.';

