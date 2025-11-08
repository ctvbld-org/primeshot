-- Migration: Add subscription month tracking and idempotency protection
-- Description: Adds month tracking for credit awards, webhook event deduplication,
--              and invoice-level idempotency to prevent duplicate credit awards

-- ============================================================================
-- Part 1: Add month tracking to user_subscriptions
-- ============================================================================

-- Add column to track which month of credits was last awarded
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS last_awarded_month INTEGER DEFAULT 0;

COMMENT ON COLUMN user_subscriptions.last_awarded_month IS 
'Number of complete months of credits awarded since subscription start. 0 = initial signup credits, 1 = first monthly award, etc.';

-- Create index for efficient queries by cron job
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_credit_award 
ON user_subscriptions(status, last_awarded_month, created_at) 
WHERE status = 'active';

-- ============================================================================
-- Part 2: Add invoice tracking to user_credits for idempotency
-- ============================================================================

-- Add invoice_id column for tracking which invoice awarded credits
ALTER TABLE user_credits 
ADD COLUMN IF NOT EXISTS invoice_id TEXT;

COMMENT ON COLUMN user_credits.invoice_id IS 
'Stripe invoice ID that triggered this credit award. Used for idempotency to prevent duplicate awards.';

-- Create unique constraint to prevent duplicate credit awards for same invoice
CREATE UNIQUE INDEX IF NOT EXISTS unique_subscription_invoice_credit 
ON user_credits (source_id, invoice_id)
WHERE transaction_type = 'earned' 
  AND source_type = 'subscription'
  AND invoice_id IS NOT NULL;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_credits_invoice_id 
ON user_credits(invoice_id) 
WHERE invoice_id IS NOT NULL;

-- ============================================================================
-- Part 3: Create webhook_events table for deduplication
-- ============================================================================

-- Track all received webhook events to prevent duplicate processing
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  result JSONB,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE webhook_events IS 
'Tracks all Stripe webhook events for deduplication and audit trail';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id 
ON webhook_events(stripe_event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status 
ON webhook_events(status, created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_events_type 
ON webhook_events(event_type, created_at);

-- ============================================================================
-- Part 4: Create idempotent RPC function for awarding subscription credits
-- ============================================================================

CREATE OR REPLACE FUNCTION award_subscription_credits_idempotent(
  p_user_id UUID,
  p_subscription_id TEXT,
  p_invoice_id TEXT,
  p_month_number INTEGER,
  p_credits INTEGER,
  p_expires_at TIMESTAMP WITH TIME ZONE,
  p_period_start TIMESTAMP WITH TIME ZONE,
  p_period_end TIMESTAMP WITH TIME ZONE,
  p_description TEXT,
  p_metadata JSONB
) RETURNS JSONB AS $$
DECLARE
  v_existing_credit_id UUID;
  v_result JSONB;
BEGIN
  -- Check if credits already awarded for this invoice
  SELECT id INTO v_existing_credit_id
  FROM user_credits
  WHERE source_id = p_subscription_id
    AND invoice_id = p_invoice_id
    AND transaction_type = 'earned'
    AND source_type = 'subscription';
  
  IF v_existing_credit_id IS NOT NULL THEN
    -- Credits already awarded, return existing record
    RETURN jsonb_build_object(
      'status', 'already_awarded',
      'credit_id', v_existing_credit_id,
      'message', 'Credits already awarded for invoice ' || p_invoice_id
    );
  END IF;
  
  -- Update subscription periods and month tracking atomically
  UPDATE user_subscriptions 
  SET 
    current_period_start = p_period_start,
    current_period_end = p_period_end,
    last_awarded_month = GREATEST(COALESCE(last_awarded_month, 0), p_month_number),
    updated_at = NOW()
  WHERE stripe_subscription_id = p_subscription_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;
  
  -- Award credits atomically in same transaction
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
    p_credits, 
    'earned', 
    'subscription',
    p_subscription_id, 
    p_invoice_id,
    p_expires_at, 
    p_description || ' (Month ' || p_month_number || ')',
    jsonb_build_object(
      'month_number', p_month_number,
      'awarded_at', NOW(),
      'award_type', 'webhook'
    ) || COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_existing_credit_id;
  
  RETURN jsonb_build_object(
    'status', 'awarded',
    'credit_id', v_existing_credit_id,
    'credits', p_credits,
    'month_number', p_month_number,
    'message', 'Credits awarded successfully'
  );
  
EXCEPTION
  WHEN unique_violation THEN
    -- Another concurrent call already inserted, this is OK
    SELECT id INTO v_existing_credit_id
    FROM user_credits
    WHERE source_id = p_subscription_id
      AND invoice_id = p_invoice_id
      AND transaction_type = 'earned'
      AND source_type = 'subscription'
    LIMIT 1;
    
    RETURN jsonb_build_object(
      'status', 'already_awarded',
      'credit_id', v_existing_credit_id,
      'message', 'Credits already awarded by concurrent request'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION award_subscription_credits_idempotent IS 
'Atomically awards subscription credits with invoice-level idempotency protection. Prevents duplicate credit awards from concurrent webhook calls.';

-- ============================================================================
-- Part 5: Create RPC function for monthly credit allocation (cron job)
-- ============================================================================

CREATE OR REPLACE FUNCTION award_monthly_subscription_credits(
  p_user_id UUID,
  p_subscription_id TEXT,
  p_month_number INTEGER,
  p_credits INTEGER,
  p_plan_name TEXT
) RETURNS JSONB AS $$
DECLARE
  v_subscription_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
  v_existing_credit_id UUID;
  v_synthetic_invoice_id TEXT;
BEGIN
  -- Get subscription start date
  SELECT created_at INTO v_subscription_start
  FROM user_subscriptions
  WHERE stripe_subscription_id = p_subscription_id;
  
  IF v_subscription_start IS NULL THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
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
      'message', 'Month already processed'
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
    p_credits,
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
      'period_end', v_period_end
    )
  )
  RETURNING id INTO v_existing_credit_id;
  
  RETURN jsonb_build_object(
    'status', 'awarded',
    'credit_id', v_existing_credit_id,
    'credits', p_credits,
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
'Awards monthly subscription credits via cron job. Uses calendar month arithmetic and synthetic invoice IDs for idempotency.';

-- ============================================================================
-- Part 6: Create helper function to get subscriptions needing credits
-- ============================================================================

CREATE OR REPLACE FUNCTION get_subscriptions_needing_monthly_credits()
RETURNS TABLE (
  subscription_id TEXT,
  user_id UUID,
  plan_name TEXT,
  credits_per_month INTEGER,
  months_elapsed INTEGER,
  last_awarded_month INTEGER,
  months_due INTEGER,
  subscription_start TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.stripe_subscription_id,
    us.user_id,
    us.plan_name,
    -- Determine credits based on plan name
    CASE 
      WHEN us.plan_name = 'basic' THEN 50
      WHEN us.plan_name = 'standard' THEN 100
      WHEN us.plan_name = 'pro' THEN 150
      ELSE 0
    END AS credits_per_month,
    -- Calculate complete months elapsed since subscription start
    (EXTRACT(YEAR FROM AGE(NOW(), us.created_at))::INTEGER * 12 + 
     EXTRACT(MONTH FROM AGE(NOW(), us.created_at))::INTEGER) AS months_elapsed,
    COALESCE(us.last_awarded_month, 0) AS last_awarded_month,
    -- Calculate how many months of credits are due
    (EXTRACT(YEAR FROM AGE(NOW(), us.created_at))::INTEGER * 12 + 
     EXTRACT(MONTH FROM AGE(NOW(), us.created_at))::INTEGER) - 
     COALESCE(us.last_awarded_month, 0) AS months_due,
    us.created_at AS subscription_start
  FROM user_subscriptions us
  WHERE us.status = 'active'
    AND us.stripe_subscription_id IS NOT NULL
    AND (EXTRACT(YEAR FROM AGE(NOW(), us.created_at))::INTEGER * 12 + 
         EXTRACT(MONTH FROM AGE(NOW(), us.created_at))::INTEGER) > 
         COALESCE(us.last_awarded_month, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_subscriptions_needing_monthly_credits IS 
'Returns all active subscriptions that have months of credits due. Used by cron job to identify subscriptions needing credit awards.';

-- ============================================================================
-- Part 7: Add RLS policies for webhook_events (admin only)
-- ============================================================================

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write webhook events
DROP POLICY IF EXISTS webhook_events_service_role_all ON webhook_events;
CREATE POLICY webhook_events_service_role_all 
ON webhook_events 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- ============================================================================
-- Part 8: Create audit log for credit awards
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_award_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  subscription_id TEXT NOT NULL,
  month_number INTEGER NOT NULL,
  credits_awarded INTEGER NOT NULL,
  award_type TEXT NOT NULL, -- 'webhook', 'cron_job', 'retroactive'
  invoice_id TEXT,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  awarded_by TEXT, -- 'system', 'admin', etc.
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_award_audit_user 
ON credit_award_audit(user_id, awarded_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_award_audit_subscription 
ON credit_award_audit(subscription_id, month_number);

COMMENT ON TABLE credit_award_audit IS 
'Audit trail of all credit awards for compliance and debugging';

ALTER TABLE credit_award_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credit_award_audit_service_role_all ON credit_award_audit;
CREATE POLICY credit_award_audit_service_role_all 
ON credit_award_audit 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

