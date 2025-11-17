-- ============================================================================
-- PRODUCTION FIX: Test deduct_credits manually and check for errors
-- ============================================================================

-- Test with a real user who has credits
DO $$
DECLARE
  v_test_user_id UUID := '85c4b7b4-7d2e-4610-be2e-0d82cd9249ee';
  v_result JSONB;
  v_before_used INTEGER;
  v_after_used INTEGER;
BEGIN
  -- Get current state
  SELECT current_period_credits_used INTO v_before_used
  FROM user_subscriptions
  WHERE user_id = v_test_user_id AND status = 'active';
  
  RAISE NOTICE 'Before test: current_period_credits_used = %', v_before_used;
  
  -- Try to deduct 1 credit
  SELECT deduct_credits(v_test_user_id, 1, 'Test deduction') INTO v_result;
  
  RAISE NOTICE 'Deduct result: %', v_result;
  
  -- Check new state
  SELECT current_period_credits_used INTO v_after_used
  FROM user_subscriptions
  WHERE user_id = v_test_user_id AND status = 'active';
  
  RAISE NOTICE 'After test: current_period_credits_used = %', v_after_used;
  
  IF v_after_used = v_before_used + 1 THEN
    RAISE NOTICE '✅ SUCCESS: Quota tracking is working!';
  ELSE
    RAISE NOTICE '❌ FAILED: Quota was not updated! Expected %, got %', v_before_used + 1, v_after_used;
  END IF;
END $$;

-- Check user_credits to see if the deduction was logged
SELECT 
  credits,
  transaction_type,
  source_type,
  description,
  metadata,
  created_at
FROM user_credits
WHERE user_id = '85c4b7b4-7d2e-4610-be2e-0d82cd9249ee'
ORDER BY created_at DESC
LIMIT 5;

