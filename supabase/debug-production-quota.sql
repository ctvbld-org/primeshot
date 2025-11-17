-- ============================================================================
-- PRODUCTION DEBUG: Check if deduct_credits is working correctly
-- ============================================================================
-- Run this in Supabase Dashboard > SQL Editor (PRODUCTION)
-- ============================================================================

-- 1. Check if the deduct_credits function exists and has correct source_type
SELECT 
  routine_name,
  CASE 
    WHEN routine_definition LIKE '%current_period_credits_used%' THEN '✅ Has quota tracking'
    ELSE '❌ Missing quota tracking'
  END as quota_tracking_status,
  CASE 
    WHEN routine_definition LIKE '%''inference''%' THEN '✅ Uses source_type=inference'
    WHEN routine_definition LIKE '%''usage''%' THEN '❌ Uses source_type=usage (BROKEN)'
    ELSE '⚠️ Cannot determine source_type'
  END as source_type_status
FROM information_schema.routines
WHERE routine_name = 'deduct_credits'
  AND routine_schema = 'public';

-- 2. Check if spend_user_credits calls deduct_credits
SELECT 
  routine_name,
  CASE 
    WHEN routine_definition LIKE '%deduct_credits%' THEN '✅ Calls deduct_credits'
    ELSE '❌ Does NOT call deduct_credits'
  END as calls_deduct_status
FROM information_schema.routines
WHERE routine_name = 'spend_user_credits'
  AND routine_schema = 'public';

-- 3. Test the function with a real user
-- First, get a test user ID
SELECT id as test_user_id
FROM auth.users
LIMIT 1;

-- 4. Check their current quota status
SELECT 
  user_id,
  plan_name,
  monthly_credits_quota,
  current_period_credits_used,
  (monthly_credits_quota - current_period_credits_used) as available
FROM user_subscriptions
WHERE status = 'active'
LIMIT 5;

-- 5. Check recent credit_usage entries
SELECT 
  user_id,
  credits_used,
  usage_type,
  created_at
FROM credit_usage
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- If deduct_credits is missing quota tracking, we need to re-apply migration
-- ============================================================================

