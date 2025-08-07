-- Check if any refund attempts were made for the failed training job
-- Job ID: 185f3d06-e5b5-4ecd-9785-65052d9176bf

-- Check for any existing refunds for this job
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
ORDER BY created_at DESC;

-- Check the exact training job details
SELECT 
  id,
  user_id,
  character_id,
  status,
  credits_spent,
  error_message,
  created_at,
  completed_at,
  modal_job_id
FROM training_jobs 
WHERE id = '185f3d06-e5b5-4ecd-9785-65052d9176bf';

-- Test if the refund function would work for this job
-- (This should either create a refund or tell us a refund already exists)
SELECT refund_credits_with_idempotency(
  'd2a1c825-a8ae-4a67-8f54-bf10f01dac3f'::UUID,  -- user_id
  '185f3d06-e5b5-4ecd-9785-65052d9176bf'::UUID,   -- job_id
  30,                                               -- amount
  'Test refund for failed training: TRAINING_API_URL env variable not configured',
  'test_refund_185f3d06_check'                     -- test idempotency key
) AS test_refund_result;