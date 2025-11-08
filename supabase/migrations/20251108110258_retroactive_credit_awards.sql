-- Migration: Retroactive Credit Awards for Existing Subscriptions
-- Description: One-time script to award missing monthly credits to yearly subscriptions
--              that existed before the monthly credit allocation system was implemented

-- ============================================================================
-- WARNING: This is a one-time migration script
-- ============================================================================
-- This script should be run ONCE after deploying the monthly credit system.
-- It will:
-- 1. Find all active yearly subscriptions
-- 2. Calculate how many months they've been active
-- 3. Award retroactive credits for missed months
-- 4. Update last_awarded_month tracking

-- ============================================================================
-- Step 1: Identify subscriptions needing retroactive credits
-- ============================================================================

DO $$
DECLARE
  v_subscription RECORD;
  v_months_elapsed INTEGER;
  v_last_awarded INTEGER;
  v_months_to_award INTEGER;
  v_month INTEGER;
  v_result JSONB;
  v_total_subscriptions INTEGER := 0;
  v_total_credits_awarded INTEGER := 0;
  v_total_months_awarded INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting retroactive credit award process...';
  RAISE NOTICE 'Timestamp: %', NOW();
  RAISE NOTICE '========================================';

  -- Loop through all active subscriptions
  FOR v_subscription IN (
    SELECT 
      us.user_id,
      us.stripe_subscription_id,
      us.plan_name,
      us.created_at,
      COALESCE(us.last_awarded_month, 0) AS last_awarded_month,
      -- Calculate months elapsed
      (EXTRACT(YEAR FROM AGE(NOW(), us.created_at))::INTEGER * 12 + 
       EXTRACT(MONTH FROM AGE(NOW(), us.created_at))::INTEGER) AS months_elapsed
    FROM user_subscriptions us
    WHERE us.status = 'active'
      AND us.stripe_subscription_id IS NOT NULL
      AND (EXTRACT(YEAR FROM AGE(NOW(), us.created_at))::INTEGER * 12 + 
           EXTRACT(MONTH FROM AGE(NOW(), us.created_at))::INTEGER) > 
           COALESCE(us.last_awarded_month, 0)
  )
  LOOP
    v_total_subscriptions := v_total_subscriptions + 1;
    v_months_to_award := v_subscription.months_elapsed - v_subscription.last_awarded_month;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Processing subscription: %', v_subscription.stripe_subscription_id;
    RAISE NOTICE '  User ID: %', v_subscription.user_id;
    RAISE NOTICE '  Plan: %', v_subscription.plan_name;
    RAISE NOTICE '  Created: %', v_subscription.created_at;
    RAISE NOTICE '  Months elapsed: %', v_subscription.months_elapsed;
    RAISE NOTICE '  Last awarded month: %', v_subscription.last_awarded_month;
    RAISE NOTICE '  Months to award: %', v_months_to_award;
    
    -- Award credits for each missing month
    FOR v_month IN (v_subscription.last_awarded_month + 1)..v_subscription.months_elapsed
    LOOP
      BEGIN
        -- Call the monthly credit award function (no p_credits parameter!)
        SELECT award_monthly_subscription_credits(
          p_user_id := v_subscription.user_id,
          p_subscription_id := v_subscription.stripe_subscription_id,
          p_month_number := v_month,
          p_plan_name := v_subscription.plan_name
        ) INTO v_result;
        
        IF v_result->>'status' = 'awarded' THEN
          v_total_credits_awarded := v_total_credits_awarded + (v_result->>'credits')::INTEGER;
          v_total_months_awarded := v_total_months_awarded + 1;
          RAISE NOTICE '    ✓ Month % awarded: % credits', v_month, v_result->>'credits';
        ELSIF v_result->>'status' = 'already_awarded' THEN
          RAISE NOTICE '    ⊙ Month % already awarded (skipped)', v_month;
        ELSE
          RAISE NOTICE '    ⚠ Month % status: %', v_month, v_result->>'status';
        END IF;
        
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING '    ✗ Failed to award month %: % %', v_month, SQLERRM, SQLSTATE;
      END;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Retroactive credit award process completed';
  RAISE NOTICE 'Subscriptions processed: %', v_total_subscriptions;
  RAISE NOTICE 'Total months awarded: %', v_total_months_awarded;
  RAISE NOTICE 'Total credits awarded: %', v_total_credits_awarded;
  RAISE NOTICE 'Timestamp: %', NOW();
  RAISE NOTICE '========================================';
  
  -- Log the retroactive award process (only if subscriptions were processed)
  IF v_total_subscriptions > 0 THEN
    -- Get the first real user ID for logging purposes
    INSERT INTO credit_award_audit (
      user_id,
      subscription_id,
      month_number,
      credits_awarded,
      award_type,
      awarded_by,
      metadata
    )
    SELECT 
      (SELECT user_id FROM user_subscriptions WHERE status = 'active' LIMIT 1),
      'retroactive_migration',
      0,
      v_total_credits_awarded,
      'retroactive',
      'migration_script',
      jsonb_build_object(
        'total_subscriptions', v_total_subscriptions,
        'total_months', v_total_months_awarded,
        'total_credits', v_total_credits_awarded,
        'migration_timestamp', NOW()
      );
  ELSE
    RAISE NOTICE 'No subscriptions to process - skipping audit log entry';
  END IF;
  
END $$;

-- ============================================================================
-- Step 2: Verification Query
-- ============================================================================

-- Run this to verify the retroactive awards
SELECT 
  us.stripe_subscription_id,
  us.plan_name,
  us.created_at,
  us.last_awarded_month,
  (EXTRACT(YEAR FROM AGE(NOW(), us.created_at))::INTEGER * 12 + 
   EXTRACT(MONTH FROM AGE(NOW(), us.created_at))::INTEGER) AS months_elapsed,
  COUNT(uc.id) AS credit_entries,
  SUM(uc.credits) FILTER (WHERE uc.transaction_type = 'earned') AS total_credits_earned
FROM user_subscriptions us
LEFT JOIN user_credits uc 
  ON us.stripe_subscription_id = uc.source_id 
  AND uc.source_type = 'subscription'
WHERE us.status = 'active'
  AND us.stripe_subscription_id IS NOT NULL
GROUP BY us.stripe_subscription_id, us.plan_name, us.created_at, us.last_awarded_month
ORDER BY us.created_at DESC;

-- ============================================================================
-- Step 3: View Retroactive Award Summary
-- ============================================================================

SELECT 
  metadata->>'total_subscriptions' AS subscriptions_processed,
  metadata->>'total_months' AS months_awarded,
  metadata->>'total_credits' AS credits_awarded,
  metadata->>'migration_timestamp' AS completed_at
FROM credit_award_audit
WHERE award_type = 'retroactive'
  AND awarded_by = 'migration_script'
ORDER BY awarded_at DESC
LIMIT 1;

COMMENT ON TABLE credit_award_audit IS 
'Extended audit trail including retroactive credit awards. Check this table for migration history.';

