-- ============================================================================
-- PRODUCTION CREDIT CLEANUP - Run Once After Migration
-- ============================================================================
-- This resets subscription quotas and purchased credits to correct values
-- Run this in Supabase Dashboard > SQL Editor (PRODUCTION)
-- ============================================================================

-- Step 1: Reset purchased credits to 0 (old accumulated credits from old system)
UPDATE credit_pack_purchases
SET remaining_credits = 0
WHERE status = 'completed';

-- Step 2: Fix subscription quotas to match plan amounts
UPDATE user_subscriptions us
SET 
  monthly_credits_quota = s.credits,
  current_period_credits_used = 0,
  last_quota_reset_at = us.current_period_start,
  updated_at = NOW()
FROM subscriptions s
WHERE us.plan_name = s.name
  AND us.status = 'active';

-- Verification: Check your balance now
SELECT 
  us.plan_name,
  us.monthly_credits_quota,
  us.current_period_credits_used,
  (us.monthly_credits_quota - us.current_period_credits_used) as available_from_subscription,
  COALESCE(SUM(cpp.remaining_credits), 0) as purchased_credits_remaining
FROM user_subscriptions us
LEFT JOIN credit_pack_purchases cpp ON cpp.user_id = us.user_id AND cpp.status = 'completed' AND cpp.expires_at > NOW()
WHERE us.status = 'active'
GROUP BY us.user_id, us.plan_name, us.monthly_credits_quota, us.current_period_credits_used
LIMIT 10;

-- Expected: monthly_credits_quota should match your plan (e.g., 680)
-- Expected: purchased_credits_remaining should be 0

-- ============================================================================

