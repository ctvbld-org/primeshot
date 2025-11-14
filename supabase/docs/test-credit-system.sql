-- ============================================================================
-- Credit System Testing Script
-- Run these queries to verify the new credit system works correctly
-- ============================================================================

-- ============================================================================
-- Setup: Create Test User and Data
-- ============================================================================

-- Create test user (if doesn't exist)
INSERT INTO auth.users (
  instance_id,
  id, 
  aud,
  role,
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test-credit-user-123'::uuid,
  'authenticated',
  'authenticated',
  'test-credits@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false
)
ON CONFLICT (id) DO NOTHING;

-- Create Pro subscription for test user
INSERT INTO user_subscriptions (
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  stripe_price_id,
  plan_name,
  status,
  current_period_start,
  current_period_end,
  monthly_credits_quota,
  current_period_credits_used,
  last_quota_reset_at,
  created_at,
  updated_at
) VALUES (
  'test-credit-user-123'::uuid,
  'sub_test_credit_123',
  'cus_test_123',
  'price_test_pro',
  'pro',
  'active',
  NOW(),
  NOW() + INTERVAL '1 month',
  680,  -- Pro plan quota
  0,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (stripe_subscription_id) DO UPDATE
SET 
  status = 'active',
  monthly_credits_quota = 680,
  current_period_credits_used = 0,
  last_quota_reset_at = NOW();

-- Create purchased credits
INSERT INTO credit_pack_purchases (
  user_id,
  stripe_payment_intent_id,
  stripe_price_id,
  credits_purchased,
  remaining_credits,
  amount_paid,
  status,
  expires_at,
  created_at
) VALUES (
  'test-credit-user-123'::uuid,
  'pi_test_purchase_123',
  'price_test_100',
  100,
  100,
  1000,
  'completed',
  NOW() + INTERVAL '90 days',
  NOW()
)
ON CONFLICT (stripe_payment_intent_id) DO UPDATE
SET remaining_credits = 100;

-- ============================================================================
-- Test 1: Get Available Credits
-- ============================================================================

SELECT '=== Test 1: Get Available Credits ===' AS test;

SELECT get_available_credits('test-credit-user-123'::uuid);
-- Expected: { "total": 780, "subscription": 680, "purchased": 100 }

-- ============================================================================
-- Test 2: Deduct from Subscription Quota First
-- ============================================================================

SELECT '=== Test 2: Deduct Credits (Priority: Subscription) ===' AS test;

SELECT deduct_credits(
  'test-credit-user-123'::uuid,
  50,
  'Test: Generate 50 images'
);
-- Expected: { "success": true, "deducted": 50, "breakdown": { "subscription": 50, "purchased": 0 } }

-- Verify subscription was deducted
SELECT 
  monthly_credits_quota,
  current_period_credits_used,
  (monthly_credits_quota - current_period_credits_used) AS available
FROM user_subscriptions
WHERE stripe_subscription_id = 'sub_test_credit_123';
-- Expected: quota=680, used=50, available=630

-- Verify purchased credits untouched
SELECT remaining_credits
FROM credit_pack_purchases
WHERE stripe_payment_intent_id = 'pi_test_purchase_123';
-- Expected: 100 (unchanged)

-- Check balance
SELECT get_available_credits('test-credit-user-123'::uuid);
-- Expected: { "total": 730, "subscription": 630, "purchased": 100 }

-- ============================================================================
-- Test 3: Deduct More Than Subscription Quota (Use Purchased)
-- ============================================================================

SELECT '=== Test 3: Deduct Across Subscription + Purchased ===' AS test;

SELECT deduct_credits(
  'test-credit-user-123'::uuid,
  700,  -- More than subscription quota
  'Test: Generate 700 images'
);
-- Expected: { "success": true, "deducted": 700, "breakdown": { "subscription": 630, "purchased": 70 } }

-- Verify subscription fully used
SELECT 
  monthly_credits_quota,
  current_period_credits_used
FROM user_subscriptions
WHERE stripe_subscription_id = 'sub_test_credit_123';
-- Expected: quota=680, used=680 (fully consumed)

-- Verify purchased credits partially used
SELECT 
  credits_purchased,
  remaining_credits
FROM credit_pack_purchases
WHERE stripe_payment_intent_id = 'pi_test_purchase_123';
-- Expected: purchased=100, remaining=30

-- Check balance
SELECT get_available_credits('test-credit-user-123'::uuid);
-- Expected: { "total": 30, "subscription": 0, "purchased": 30 }

-- ============================================================================
-- Test 4: Reset Subscription Quota
-- ============================================================================

SELECT '=== Test 4: Reset Subscription Quota ===' AS test;

SELECT reset_subscription_quota('sub_test_credit_123');
-- Expected: { "success": true, "user_id": "...", "quota": 680, "message": "Quota reset successfully" }

-- Verify quota was reset
SELECT 
  monthly_credits_quota,
  current_period_credits_used,
  last_quota_reset_at
FROM user_subscriptions
WHERE stripe_subscription_id = 'sub_test_credit_123';
-- Expected: quota=680, used=0, last_quota_reset_at=(recent)

-- Check balance after reset
SELECT get_available_credits('test-credit-user-123'::uuid);
-- Expected: { "total": 710, "subscription": 680, "purchased": 30 }

-- ============================================================================
-- Test 5: Expire Purchased Credits (Only Remaining Amount)
-- ============================================================================

SELECT '=== Test 5: Expire Old Purchased Credits ===' AS test;

-- Create an expired purchase with 20 remaining credits
INSERT INTO credit_pack_purchases (
  user_id,
  stripe_payment_intent_id,
  stripe_price_id,
  credits_purchased,
  remaining_credits,
  amount_paid,
  status,
  expires_at,
  created_at
) VALUES (
  'test-credit-user-123'::uuid,
  'pi_test_expired_456',
  'price_test_50',
  50,
  20,  -- Only 20 remaining (30 were used)
  500,
  'completed',
  NOW() - INTERVAL '1 day',  -- Already expired!
  NOW() - INTERVAL '91 days'
)
ON CONFLICT (stripe_payment_intent_id) DO UPDATE
SET 
  remaining_credits = 20,
  expires_at = NOW() - INTERVAL '1 day';

-- Run expiration
SELECT expire_old_purchased_credits();
-- Expected: { "success": true, "expired_credits": 20, "batches_expired": 1 }

-- Verify only 20 credits were removed (not 50!)
SELECT 
  credits_purchased,
  remaining_credits
FROM credit_pack_purchases
WHERE stripe_payment_intent_id = 'pi_test_expired_456';
-- Expected: purchased=50, remaining=0

-- Check expiration log
SELECT 
  credits,
  transaction_type,
  description,
  metadata
FROM user_credits
WHERE source_id = 'pi_test_expired_456'
  AND transaction_type = 'expired'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: credits=-20, type='expired', description contains 'expired (unused)'

-- ============================================================================
-- Test 6: FIFO (First In, First Out) for Multiple Purchases
-- ============================================================================

SELECT '=== Test 6: FIFO Expiration Logic ===' AS test;

-- Create two purchases with different expiration dates
INSERT INTO credit_pack_purchases (
  user_id,
  stripe_payment_intent_id,
  stripe_price_id,
  credits_purchased,
  remaining_credits,
  amount_paid,
  status,
  expires_at,
  created_at
) VALUES 
  (
    'test-credit-user-123'::uuid,
    'pi_test_fifo_1',
    'price_test',
    100,
    100,
    1000,
    'completed',
    NOW() + INTERVAL '30 days',  -- Expires soon
    NOW()
  ),
  (
    'test-credit-user-123'::uuid,
    'pi_test_fifo_2',
    'price_test',
    100,
    100,
    1000,
    'completed',
    NOW() + INTERVAL '60 days',  -- Expires later
    NOW()
  )
ON CONFLICT (stripe_payment_intent_id) DO UPDATE
SET remaining_credits = 100;

-- Deduct 150 credits (should use oldest first)
SELECT deduct_credits(
  'test-credit-user-123'::uuid,
  150,
  'Test: FIFO deduction'
);

-- Check which purchase was used first
SELECT 
  stripe_payment_intent_id,
  credits_purchased,
  remaining_credits,
  expires_at
FROM credit_pack_purchases
WHERE user_id = 'test-credit-user-123'::uuid
  AND stripe_payment_intent_id LIKE 'pi_test_fifo_%'
ORDER BY expires_at ASC;
-- Expected:
-- pi_test_fifo_1: 100 purchased, 0 remaining (used first - expires soonest)
-- pi_test_fifo_2: 100 purchased, 50 remaining (partially used)

-- ============================================================================
-- Test 7: Check Transaction Audit Log
-- ============================================================================

SELECT '=== Test 7: Audit Log Verification ===' AS test;

SELECT 
  credits,
  transaction_type,
  source_type,
  description,
  metadata,
  created_at
FROM user_credits
WHERE user_id = 'test-credit-user-123'::uuid
ORDER BY created_at DESC
LIMIT 10;
-- Should show complete history of all transactions

-- ============================================================================
-- Cleanup (Optional - uncomment to clean up test data)
-- ============================================================================

-- SELECT '=== Cleanup Test Data ===' AS test;
-- 
-- DELETE FROM user_credits WHERE user_id = 'test-credit-user-123'::uuid;
-- DELETE FROM credit_pack_purchases WHERE user_id = 'test-credit-user-123'::uuid;
-- DELETE FROM user_subscriptions WHERE user_id = 'test-credit-user-123'::uuid;
-- DELETE FROM auth.users WHERE id = 'test-credit-user-123'::uuid;

-- ============================================================================
-- ✅ All Tests Complete
-- ============================================================================

SELECT '=== ✅ All Tests Complete ===' AS test;
SELECT 'Review the results above to verify all functions work correctly' AS instructions;

