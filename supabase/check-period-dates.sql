-- ============================================================================
-- CHECK: Are current_period_end dates correct on production?
-- ============================================================================

SELECT 
  user_id,
  plan_name,
  status,
  current_period_start,
  current_period_end,
  CASE 
    WHEN current_period_end < NOW() THEN '❌ EXPIRED (will reset every hour!)'
    WHEN current_period_end > NOW() THEN '✅ Valid (won''t reset)'
    ELSE '⚠️ NULL or invalid'
  END as period_status,
  last_quota_reset_at,
  monthly_credits_quota,
  current_period_credits_used
FROM user_subscriptions
WHERE status = 'active'
ORDER BY current_period_end DESC NULLS LAST
LIMIT 10;

-- If all show "EXPIRED", that's the problem!
-- The cron thinks all subscriptions need resetting every hour

