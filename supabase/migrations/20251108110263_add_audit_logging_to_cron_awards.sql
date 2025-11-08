-- Fix: Add audit logging to award_monthly_subscription_credits function
-- This ensures cron awards are logged to credit_award_audit table

CREATE OR REPLACE FUNCTION award_monthly_subscription_credits(
  p_user_id UUID,
  p_subscription_id TEXT,
  p_month_number INTEGER,
  p_plan_name TEXT
) RETURNS JSONB AS $$
DECLARE
  v_subscription_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
  v_synthetic_invoice_id TEXT;
  v_existing_credit_id UUID;
  v_credits_to_award INTEGER;
BEGIN
  -- Get subscription start date and credits from subscriptions table
  SELECT us.created_at, s.credits INTO v_subscription_start, v_credits_to_award
  FROM user_subscriptions us
  LEFT JOIN subscriptions s ON us.plan_name = s.name
  WHERE us.stripe_subscription_id = p_subscription_id;

  IF v_subscription_start IS NULL THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;

  IF v_credits_to_award IS NULL THEN
    RAISE EXCEPTION 'Credits not found for plan: %', p_plan_name;
  END IF;

  -- Calculate period end (subscription start + month_number months)
  v_period_end := v_subscription_start + (p_month_number || ' months')::INTERVAL;
  
  -- Create synthetic invoice ID for idempotency
  v_synthetic_invoice_id := 'cron_month_' || p_month_number || '_sub_' || p_subscription_id;
  
  -- Check if already awarded
  SELECT id INTO v_existing_credit_id
  FROM user_credits
  WHERE invoice_id = v_synthetic_invoice_id;

  IF v_existing_credit_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_awarded',
      'credits', v_credits_to_award,
      'message', 'Credits already awarded for month ' || p_month_number,
      'credit_id', v_existing_credit_id,
      'month_number', p_month_number
    );
  END IF;

  -- Award credits
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
    v_credits_to_award,
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
      'credits_from_plan', v_credits_to_award
    )
  )
  RETURNING id INTO v_existing_credit_id;

  -- Update last_awarded_month
  UPDATE user_subscriptions
  SET last_awarded_month = p_month_number,
      updated_at = NOW()
  WHERE stripe_subscription_id = p_subscription_id;

  -- ✅ NEW: Log to audit table
  INSERT INTO credit_award_audit (
    user_id,
    subscription_id,
    month_number,
    credits_awarded,
    award_type,
    invoice_id,
    awarded_by,
    metadata
  ) VALUES (
    p_user_id,
    p_subscription_id,
    p_month_number,
    v_credits_to_award,
    'cron_job',
    v_synthetic_invoice_id,
    'cron_job',
    jsonb_build_object(
      'plan_name', p_plan_name,
      'subscription_start', v_subscription_start,
      'period_end', v_period_end
    )
  );

  RETURN jsonb_build_object(
    'status', 'awarded',
    'credits', v_credits_to_award,
    'message', 'Monthly credits awarded successfully',
    'credit_id', v_existing_credit_id,
    'month_number', p_month_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION award_monthly_subscription_credits IS
'Awards monthly subscription credits via cron job with audit logging. Looks up credit amount from subscriptions table based on plan name.';

