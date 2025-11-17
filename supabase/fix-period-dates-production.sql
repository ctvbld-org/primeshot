-- ============================================================================
-- FIX: Update current_period_end dates from Stripe subscriptions
-- ============================================================================
-- This fixes the bug where expired period_end dates cause hourly quota resets
-- 
-- IMPORTANT: This uses Stripe subscription data to set correct period dates
-- Run this ONCE in Production SQL Editor
-- ============================================================================

-- Step 1: Check which subscriptions need fixing
SELECT 
  us.stripe_subscription_id,
  us.plan_name,
  us.current_period_end,
  CASE 
    WHEN us.current_period_end < NOW() THEN '❌ NEEDS FIX'
    ELSE '✅ OK'
  END as status
FROM user_subscriptions us
WHERE us.status = 'active'
ORDER BY us.current_period_end;

-- ============================================================================
-- MANUAL FIX REQUIRED:
-- ============================================================================
-- Unfortunately, we cannot query Stripe directly from SQL.
-- You need to either:
--
-- 1. Run the webhook again for each subscription
-- 2. Manually update period dates from Stripe Dashboard
-- 3. Use this template to update dates:
--
-- UPDATE user_subscriptions
-- SET 
--   current_period_start = '2025-11-16 00:00:00+00',  -- From Stripe
--   current_period_end = '2025-12-16 00:00:00+00',    -- From Stripe (1 month later)
--   updated_at = NOW()
-- WHERE stripe_subscription_id = 'sub_xxxxx';
--
-- ============================================================================

-- BETTER SOLUTION: Fix the webhook to always set these dates correctly!
-- See: webapp/src/app/api/payment/webhook/route.ts
-- The handleSubscriptionEvent function should ALWAYS update period dates

