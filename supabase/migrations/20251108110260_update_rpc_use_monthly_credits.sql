-- Update RPC functions to use actual credits from subscriptions table

-- Update get_subscriptions_needing_monthly_credits to JOIN with subscriptions table
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
    -- Get actual credits from subscriptions table
    COALESCE(s.credits, 0) AS credits_per_month,
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
  LEFT JOIN subscriptions s ON us.plan_name = s.name
  WHERE us.status = 'active'
    AND us.stripe_subscription_id IS NOT NULL
    AND (EXTRACT(YEAR FROM AGE(NOW(), us.created_at))::INTEGER * 12 + 
         EXTRACT(MONTH FROM AGE(NOW(), us.created_at))::INTEGER) > 
         COALESCE(us.last_awarded_month, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_subscriptions_needing_monthly_credits IS 
'Returns all active subscriptions that have months of credits due. Joins with subscriptions table to get actual credit amounts.';


