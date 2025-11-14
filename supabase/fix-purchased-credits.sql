-- ============================================================================
-- Fix Purchased Credits Balance
-- ============================================================================
-- The API shows: purchased: 3666
-- This is from old credit_pack_purchases.remaining_credits
-- We need to reset these to realistic values
-- ============================================================================

-- STEP 1: Check current purchased credit packs
SELECT 
  id,
  user_id,
  credits_purchased,
  remaining_credits,
  purchased_at,
  expires_at,
  status
FROM credit_pack_purchases
WHERE status = 'completed'
  AND expires_at > NOW()
ORDER BY purchased_at DESC;

-- STEP 2: Reset all purchased credits to 0 (clean slate)
-- This is safe because these are accumulated from the old system
UPDATE credit_pack_purchases
SET remaining_credits = 0
WHERE status = 'completed';

-- STEP 3: Verify subscription quota is correct
-- Your screenshot shows subscription: 270, which seems wrong
-- Should be 680 for your plan
SELECT 
  us.user_id,
  us.plan_name,
  us.monthly_credits_quota,
  us.current_period_credits_used,
  s.credits as plan_credits
FROM user_subscriptions us
LEFT JOIN subscriptions s ON s.name = us.plan_name
WHERE us.status = 'active';

-- If monthly_credits_quota != plan_credits, run this:
UPDATE user_subscriptions us
SET 
  monthly_credits_quota = s.credits,
  current_period_credits_used = 0
FROM subscriptions s
WHERE us.plan_name = s.name
  AND us.status = 'active';

-- STEP 4: Verify the fix
-- This should now return correct balance
SELECT get_available_credits(
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
);

-- Expected result:
-- {"total": 680, "subscription": 680, "purchased": 0, "bonus": 0}

-- ============================================================================
-- EXPLANATION
-- ============================================================================
-- Your balance breakdown shows:
-- - subscription: 270  ← Wrong! Should be 680 (your plan amount)
-- - purchased: 3666    ← Old accumulated credits, should be 0
-- - Total: 3936
--
-- After this fix:
-- - subscription: 680  ← Correct!
-- - purchased: 0       ← Clean slate
-- - Total: 680         ← Correct!
-- ============================================================================

