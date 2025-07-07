-- Migration: Fix refund race condition with idempotency protection
-- Adds unique constraint to prevent duplicate refunds and creates atomic spend-and-track function

-- 1. Add unique constraint to prevent duplicate refunds based on idempotency key
-- This prevents the same refund from being processed multiple times
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_user_credits_refund_idempotency 
ON user_credits (user_id, source_type, source_id, (metadata->>'idempotency_key'))
WHERE source_type = 'refund' AND metadata->>'idempotency_key' IS NOT NULL;

-- 2. Create atomic function to spend credits and track job creation in a single transaction
CREATE OR REPLACE FUNCTION spend_credits_with_job_tracking(
    p_user_id UUID,
    p_job_id UUID,
    p_amount INTEGER,
    p_usage_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(success BOOLEAN, current_balance INTEGER, error_message TEXT) AS $$
DECLARE
    initial_balance INTEGER;
    final_balance INTEGER;
    spend_success BOOLEAN;
BEGIN
    -- Start transaction (function is automatically wrapped in transaction)
    
    -- Get initial balance
    SELECT get_user_credit_balance(p_user_id) INTO initial_balance;
    
    -- Check if user has enough credits
    IF initial_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, initial_balance, 'Insufficient credits'::TEXT;
        RETURN;
    END IF;
    
    -- Attempt to spend credits using existing function
    SELECT spend_user_credits(
        p_user_id,
        p_amount,
        p_usage_type,
        p_description,
        p_metadata || jsonb_build_object('job_id', p_job_id)
    ) INTO spend_success;
    
    IF NOT spend_success THEN
        RETURN QUERY SELECT FALSE, initial_balance, 'Failed to spend credits'::TEXT;
        RETURN;
    END IF;
    
    -- Get final balance
    SELECT get_user_credit_balance(p_user_id) INTO final_balance;
    
    -- Return success
    RETURN QUERY SELECT TRUE, final_balance, NULL::TEXT;
    
EXCEPTION WHEN OTHERS THEN
    -- Log error and return failure
    RAISE LOG 'spend_credits_with_job_tracking error for user % job %: %', p_user_id, p_job_id, SQLERRM;
    RETURN QUERY SELECT FALSE, COALESCE(initial_balance, 0), SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to safely refund credits with idempotency protection
CREATE OR REPLACE FUNCTION refund_credits_with_idempotency(
    p_user_id UUID,
    p_job_id UUID,
    p_amount INTEGER,
    p_reason TEXT,
    p_idempotency_key TEXT
)
RETURNS TABLE(success BOOLEAN, refund_created BOOLEAN, error_message TEXT) AS $$
DECLARE
    existing_refund_count INTEGER;
BEGIN
    -- Check if refund already exists with this idempotency key
    SELECT COUNT(*) INTO existing_refund_count
    FROM user_credits 
    WHERE user_id = p_user_id 
      AND source_type = 'refund'
      AND source_id = p_job_id::TEXT
      AND metadata->>'idempotency_key' = p_idempotency_key;
    
    -- If refund already exists, return success but indicate no new refund created
    IF existing_refund_count > 0 THEN
        RETURN QUERY SELECT TRUE, FALSE, 'Refund already processed'::TEXT;
        RETURN;
    END IF;
    
    -- Create new refund record
    INSERT INTO user_credits (
        user_id,
        credits,
        transaction_type,
        source_type,
        source_id,
        description,
        metadata
    ) VALUES (
        p_user_id,
        p_amount,
        'earned',
        'refund',
        p_job_id::TEXT,
        p_reason,
        jsonb_build_object(
            'original_job_id', p_job_id,
            'reason', 'job_creation_failed',
            'idempotency_key', p_idempotency_key
        )
    );
    
    RETURN QUERY SELECT TRUE, TRUE, NULL::TEXT;
    
EXCEPTION WHEN unique_violation THEN
    -- Handle race condition where another process created the same refund
    RETURN QUERY SELECT TRUE, FALSE, 'Concurrent refund already processed'::TEXT;
WHEN OTHERS THEN
    RAISE LOG 'refund_credits_with_idempotency error for user % job %: %', p_user_id, p_job_id, SQLERRM;
    RETURN QUERY SELECT FALSE, FALSE, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION spend_credits_with_job_tracking(UUID, UUID, INTEGER, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION refund_credits_with_idempotency(UUID, UUID, INTEGER, TEXT, TEXT) TO service_role;

-- 5. Add comments for documentation
COMMENT ON FUNCTION spend_credits_with_job_tracking IS 'Atomically spend credits and track job creation with better error handling';
COMMENT ON FUNCTION refund_credits_with_idempotency IS 'Safely refund credits with idempotency protection to prevent duplicate refunds';
COMMENT ON INDEX idx_user_credits_refund_idempotency IS 'Prevents duplicate refunds using idempotency keys'; 