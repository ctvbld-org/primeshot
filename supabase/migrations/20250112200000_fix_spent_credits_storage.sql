-- Migration: Fix spent credits storage to use positive values
-- Changes spent credits from negative to positive values for consistency
-- The transaction_type field already indicates whether credits were 'spent' or 'earned'

-- 1. Update existing spent credit records to be positive
UPDATE user_credits 
SET credits = ABS(credits)
WHERE transaction_type = 'spent' AND credits < 0;

-- 2. Fix the spend_user_credits function to store spent credits as positive values
CREATE OR REPLACE FUNCTION spend_user_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_usage_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    credit_record RECORD;
    remaining INTEGER := p_amount;
    to_spend INTEGER;
BEGIN
    -- Check if user has enough credits
    IF get_user_credit_balance(p_user_id) < p_amount THEN
        RETURN FALSE;
    END IF;

    -- Spend credits FIFO (oldest expiry first)
    FOR credit_record IN 
        SELECT * FROM user_credits
        WHERE user_id = p_user_id
          AND credits > 0
          AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY expires_at ASC NULLS LAST, created_at ASC
    LOOP
        EXIT WHEN remaining <= 0;
        
        to_spend := LEAST(remaining, credit_record.credits);
        
        -- Insert spending transaction (NOW AS POSITIVE VALUE)
        INSERT INTO user_credits (
            user_id,
            credits,
            transaction_type,
            source_type,
            source_id,
            expires_at,
            description,
            metadata
        ) VALUES (
            p_user_id,
            to_spend,  -- CHANGED: Store as positive, transaction_type indicates direction
            'spent',
            credit_record.source_type,
            credit_record.source_id,
            credit_record.expires_at,
            p_description,
            p_metadata
        );

        -- Record usage (already positive)
        INSERT INTO credit_usage (
            user_id,
            credits_used,
            usage_type,
            resolution,
            batch_size,
            metadata
        ) VALUES (
            p_user_id,
            to_spend,
            p_usage_type,
            COALESCE(p_metadata->>'resolution', NULL),
            COALESCE((p_metadata->>'batch_size')::INTEGER, NULL),
            p_metadata
        );
        
        remaining := remaining - to_spend;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 3. Update get_user_credit_balance to work with positive spent credits
CREATE OR REPLACE FUNCTION get_user_credit_balance(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    balance INTEGER;
BEGIN
    SELECT COALESCE(
        SUM(
            CASE 
                WHEN transaction_type = 'earned' THEN credits
                WHEN transaction_type = 'spent' THEN -credits  -- Apply negative for spent credits
                ELSE 0
            END
        ), 0
    )
    INTO balance
    FROM user_credits
    WHERE user_id = user_uuid
      AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN GREATEST(balance, 0);
END;
$$ LANGUAGE plpgsql;

-- 4. Comment for clarity
COMMENT ON FUNCTION spend_user_credits IS 'Spends user credits storing spent amounts as positive values with transaction_type indicating direction';
COMMENT ON FUNCTION get_user_credit_balance IS 'Calculates user credit balance applying negative sign to spent credits during calculation'; 