-- ============================================================================
-- Test Script for Credit Expiration Cron
-- ============================================================================
-- Purpose: Test that expired purchased credits are properly handled
-- ============================================================================

-- ============================================================================
-- TEST 1: Create Test Data
-- ============================================================================

-- Create a test user (if not exists)
DO $$
DECLARE
  v_test_user_id UUID;
BEGIN
  -- Try to find existing test user
  SELECT id INTO v_test_user_id
  FROM auth.users
  WHERE email = 'test-expiration@example.com'
  LIMIT 1;
  
  -- If no test user, create one
  IF v_test_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'test-expiration@example.com',
      crypt('test-password-123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO v_test_user_id;
    
    RAISE NOTICE 'Created test user: %', v_test_user_id;
  ELSE
    RAISE NOTICE 'Using existing test user: %', v_test_user_id;
  END IF;
END $$;

-- ============================================================================
-- TEST 2: Create Expired Credit Pack
-- ============================================================================

-- Insert credit pack that expired 10 days ago with remaining credits
INSERT INTO credit_pack_purchases (
  id,
  user_id,
  stripe_payment_intent_id,
  credits_purchased,
  remaining_credits,  -- Still has credits!
  price_paid,
  purchased_at,
  expires_at,  -- EXPIRED!
  status,
  metadata
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'test-expiration@example.com' LIMIT 1),
  'pi_test_expiration_' || gen_random_uuid(),
  500,
  350,  -- User spent 150, has 350 remaining
  5000,
  NOW() - INTERVAL '100 days',
  NOW() - INTERVAL '10 days',  -- EXPIRED 10 days ago
  'completed',
  jsonb_build_object('test', true, 'purpose', 'expiration_test')
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEST 3: Verify Before Expiration
-- ============================================================================

-- Show the expired credit pack
SELECT 
  id,
  user_id,
  credits_purchased,
  remaining_credits,  -- Should be 350
  expires_at,
  expires_at < NOW() as is_expired,  -- Should be TRUE
  purchased_at,
  status
FROM credit_pack_purchases
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-expiration@example.com' LIMIT 1)
  AND metadata->>'test' = 'true'
ORDER BY purchased_at DESC
LIMIT 1;

-- Check user's available credits (should NOT include expired)
SELECT get_available_credits(
  (SELECT id FROM auth.users WHERE email = 'test-expiration@example.com' LIMIT 1)
) as available_credits;

-- Expected: { "total": 0, "purchased": 0 }
-- Because expired credits are filtered out by expires_at

-- ============================================================================
-- TEST 4: Run Expiration Function
-- ============================================================================

-- Call the expiration function
SELECT * FROM expire_old_purchased_credits();

-- Expected output:
-- expired_count: 1
-- total_credits_expired: 350

-- ============================================================================
-- TEST 5: Verify After Expiration
-- ============================================================================

-- Check the credit pack again
SELECT 
  id,
  credits_purchased,
  remaining_credits,  -- Should now be 0!
  expires_at,
  status
FROM credit_pack_purchases
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-expiration@example.com' LIMIT 1)
  AND metadata->>'test' = 'true'
ORDER BY purchased_at DESC
LIMIT 1;

-- Expected:
-- remaining_credits: 0 ✅

-- Check audit log (user_credits)
SELECT 
  credits,  -- Should be -350 (negative = removed)
  transaction_type,  -- Should be 'expired'
  source_type,  -- Should be 'credit_pack'
  source_id,
  description,
  created_at,
  expires_at
FROM user_credits
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-expiration@example.com' LIMIT 1)
  AND transaction_type = 'expired'
ORDER BY created_at DESC
LIMIT 1;

-- Expected:
-- credits: -350
-- transaction_type: expired
-- source_type: credit_pack
-- description: Purchased credits expired

-- ============================================================================
-- TEST 6: Verify Available Credits Still Correct
-- ============================================================================

SELECT get_available_credits(
  (SELECT id FROM auth.users WHERE email = 'test-expiration@example.com' LIMIT 1)
) as available_credits;

-- Should still be: { "total": 0, "purchased": 0 }
-- (No change because credits were already excluded)

-- ============================================================================
-- TEST 7: Test Idempotency (Run Again)
-- ============================================================================

-- Run the function again - should find nothing
SELECT * FROM expire_old_purchased_credits();

-- Expected output:
-- expired_count: 0
-- total_credits_expired: 0

-- Verify no duplicate audit entries
SELECT 
  COUNT(*) as expiration_count,
  SUM(credits) as total_expired
FROM user_credits
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-expiration@example.com' LIMIT 1)
  AND transaction_type = 'expired'
  AND metadata->>'test' = 'true';

-- Should be: count = 1, total = -350 (only one entry)

-- ============================================================================
-- TEST 8: Cleanup (Optional)
-- ============================================================================

-- Remove test credit pack
DELETE FROM credit_pack_purchases
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-expiration@example.com' LIMIT 1)
  AND metadata->>'test' = 'true';

-- Remove test audit entries
DELETE FROM user_credits
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-expiration@example.com' LIMIT 1)
  AND transaction_type = 'expired';

-- Optionally remove test user
-- DELETE FROM auth.users WHERE email = 'test-expiration@example.com';

-- ============================================================================
-- Summary
-- ============================================================================
-- ✅ Test creates expired credit pack with remaining_credits > 0
-- ✅ Verifies get_available_credits() correctly excludes it
-- ✅ Calls expire_old_purchased_credits()
-- ✅ Verifies remaining_credits set to 0
-- ✅ Verifies audit log created
-- ✅ Verifies idempotency (no duplicates on re-run)
-- ============================================================================

