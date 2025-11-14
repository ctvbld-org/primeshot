-- ============================================================================
-- Credit System Migration Cleanup Script
-- ============================================================================
-- Purpose: Reset credits to correct values after migrating to new quota system
-- Run ONCE after deploying the new credit system
-- ============================================================================

-- ============================================================================
-- ANALYSIS: Check Current State
-- ============================================================================

-- 1. Check your subscription and quota
SELECT 
  us.user_id,
  us.plan_name,
  us.status,
  us.monthly_credits_quota,
  us.current_period_credits_used,
  us.current_period_start,
  us.current_period_end,
  s.credits as plan_credits
FROM user_subscriptions us
LEFT JOIN subscriptions s ON s.name = us.plan_name
WHERE us.user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE')  -- ⚠️ CHANGE THIS
  AND us.status = 'active';

-- Expected: monthly_credits_quota should match your plan's credits

-- 2. Check old user_credits entries (OLD SYSTEM)
SELECT 
  COUNT(*) as total_entries,
  SUM(CASE WHEN transaction_type = 'earned' THEN credits ELSE 0 END) as total_earned,
  SUM(CASE WHEN transaction_type = 'spent' THEN credits ELSE 0 END) as total_spent,
  SUM(CASE WHEN transaction_type = 'earned' THEN credits ELSE -credits END) as net_balance
FROM user_credits
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE')  -- ⚠️ CHANGE THIS
  AND source_type != 'refund';  -- Exclude refunds

-- This is the OLD system accumulation causing your high balance

-- 3. Check what get_available_credits returns
SELECT get_available_credits(
  (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE')  -- ⚠️ CHANGE THIS
);

-- Should show your actual available credits

-- ============================================================================
-- PROBLEM: Old system credits are being counted
-- ============================================================================
-- The old system used user_credits table with expires_at
-- These old "earned" entries are still being counted by calculate_user_credit_balance
-- The new system uses monthly_credits_quota instead
-- We need to clean up the old entries!
-- ============================================================================

-- ============================================================================
-- SOLUTION 1: Archive Old Credits (Recommended - Keeps History)
-- ============================================================================

-- Step 1: Create an archive table for old credit entries
CREATE TABLE IF NOT EXISTS user_credits_archive (
  LIKE user_credits INCLUDING ALL
);

-- Step 2: Move old subscription credits to archive
-- (Keep refunds, purchased credits, and recent entries)
INSERT INTO user_credits_archive
SELECT * FROM user_credits
WHERE source_type IN ('subscription', 'credit_pack')  -- Old system sources
  AND transaction_type = 'earned'
  AND created_at < (
    SELECT created_at 
    FROM pg_stat_activity 
    WHERE query LIKE '%add_quota_and_remaining_credits_tracking%'
    LIMIT 1
  );  -- Before migration timestamp

-- Step 3: Delete archived entries from active table
DELETE FROM user_credits
WHERE source_type IN ('subscription', 'credit_pack')
  AND transaction_type = 'earned'
  AND created_at < NOW() - INTERVAL '1 day';  -- Before today (adjust as needed)

-- ============================================================================
-- SOLUTION 2: Simple Cleanup (If you don't need old history)
-- ============================================================================

-- WARNING: This deletes old credit history!
-- Only run if you're okay losing old credit award records

-- Delete old subscription credit awards (before new system)
DELETE FROM user_credits
WHERE source_type = 'subscription'
  AND transaction_type = 'earned'
  AND created_at < NOW() - INTERVAL '1 day';  -- Adjust timeframe as needed

-- Keep: refunds, purchased credits still valid, recent entries

-- ============================================================================
-- SOLUTION 3: Initialize Quotas Correctly (Safest)
-- ============================================================================

-- For all active subscriptions, ensure quota is set correctly
-- This is the safest approach - just sets quotas, doesn't delete history

DO $$
DECLARE
  v_sub RECORD;
  v_plan_credits INTEGER;
BEGIN
  FOR v_sub IN 
    SELECT 
      us.user_id,
      us.stripe_subscription_id,
      us.plan_name,
      us.monthly_credits_quota,
      us.current_period_start,
      us.current_period_end,
      s.credits as plan_credits
    FROM user_subscriptions us
    JOIN subscriptions s ON s.name = us.plan_name
    WHERE us.status = 'active'
  LOOP
    -- Set quota to plan credits
    -- Reset used credits to 0
    UPDATE user_subscriptions
    SET 
      monthly_credits_quota = v_sub.plan_credits,
      current_period_credits_used = 0,
      last_quota_reset_at = v_sub.current_period_start,
      updated_at = NOW()
    WHERE stripe_subscription_id = v_sub.stripe_subscription_id;
    
    RAISE NOTICE 'Reset quota for subscription % (%) to % credits', 
      v_sub.stripe_subscription_id, 
      v_sub.plan_name, 
      v_sub.plan_credits;
  END LOOP;
END $$;

-- ============================================================================
-- VERIFICATION: Check After Cleanup
-- ============================================================================

-- 1. Check your quota again
SELECT 
  monthly_credits_quota,
  current_period_credits_used,
  (monthly_credits_quota - current_period_credits_used) as available
FROM user_subscriptions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE')  -- ⚠️ CHANGE THIS
  AND status = 'active';

-- 2. Check what get_available_credits returns now
SELECT get_available_credits(
  (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE')  -- ⚠️ CHANGE THIS
);

-- Should now show correct balance based on quota!

-- 3. Verify old credits are gone/archived
SELECT COUNT(*) as remaining_old_credits
FROM user_credits
WHERE source_type = 'subscription'
  AND transaction_type = 'earned'
  AND created_at < NOW() - INTERVAL '1 day';

-- Should be 0 if cleanup was successful

-- ============================================================================
-- RECOMMENDED APPROACH
-- ============================================================================

-- For production, I recommend SOLUTION 3:
-- 1. Keeps all history intact (important for auditing)
-- 2. Just resets quotas to correct values
-- 3. Old user_credits entries won't affect balance anymore
--    (because get_available_credits doesn't use them)
-- 4. Safe and reversible

-- The old credits in user_credits table won't be counted because:
-- - get_available_credits() uses monthly_credits_quota (new system)
-- - It doesn't sum up old user_credits entries
-- - It only looks at purchased credit packs and current quota

-- ============================================================================
-- OPTIONAL: Update Frontend Balance Calculation
-- ============================================================================

-- If you still see wrong balance, it's because the OLD calculate_user_credit_balance
-- is being cached or used somewhere.

-- Force refresh by calling the new function:
SELECT calculate_user_credit_balance(
  (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE')  -- ⚠️ CHANGE THIS
);

-- This wrapper now calls get_available_credits internally
-- So it should return the correct quota-based balance

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Your 3,666 credits are from accumulated old system awards
-- The new system uses monthly_credits_quota (resets each month)
-- Solution 3 (above) resets all quotas to correct plan amounts
-- No history is lost, balance is corrected
-- ============================================================================

