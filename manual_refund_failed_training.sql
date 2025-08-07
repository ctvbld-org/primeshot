-- Manual refund for failed training job that didn't get automatic refund
-- Job ID: 185f3d06-e5b5-4ecd-9785-65052d9176bf
-- Reason: TRAINING_API_URL env variable was not configured, causing training to fail before refund logic could execute

-- Use the same refund function that's used in the Edge Functions
SELECT refund_credits_with_idempotency(
  'd2a1c825-a8ae-4a67-8f54-bf10f01dac3f'::UUID,  -- user_id from training_jobs table
  '185f3d06-e5b5-4ecd-9785-65052d9176bf'::UUID,   -- job_id (failed training job)
  30,                                               -- amount (30 credits from training_jobs.credits_spent)
  'Manual refund for failed training: TRAINING_API_URL env variable not configured',  -- reason
  'manual_refund_185f3d06_env_issue'               -- idempotency_key
) AS refund_result;

-- Verify the refund was created
SELECT 
  id,
  user_id,
  credits,
  transaction_type,
  source_type,
  source_id,
  description,
  created_at,
  metadata
FROM user_credits 
WHERE source_id = '185f3d06-e5b5-4ecd-9785-65052d9176bf'
  AND source_type = 'refund'
ORDER BY created_at DESC;