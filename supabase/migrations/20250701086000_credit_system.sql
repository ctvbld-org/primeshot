-- Credit System Migration
-- Implements subscription-based credit system with Stripe integration

-- User subscriptions (references Stripe data only)
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    stripe_price_id TEXT NOT NULL, -- Reference to Stripe price
    plan_name TEXT NOT NULL, -- 'tier_1', 'tier_2', 'tier_3'
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit transactions and balance tracking
CREATE TABLE user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'expired', 'refunded')),
    source_type TEXT NOT NULL CHECK (source_type IN ('subscription', 'credit_pack', 'refund', 'admin')),
    source_id TEXT, -- stripe_subscription_id or stripe_payment_intent_id
    expires_at TIMESTAMP WITH TIME ZONE,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit pack purchases (references Stripe data)
CREATE TABLE credit_pack_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT NOT NULL,
    stripe_price_id TEXT NOT NULL, -- Reference to Stripe price
    credits_purchased INTEGER NOT NULL,
    amount_paid INTEGER NOT NULL, -- Amount in cents
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit usage tracking for analytics and billing
CREATE TABLE credit_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_used INTEGER NOT NULL,
    usage_type TEXT NOT NULL CHECK (usage_type IN ('image_generation', 'lora_training')),
    resolution TEXT, -- '1K', '2K', '4K'
    batch_size INTEGER,
    job_id UUID, -- Reference to training or inference job
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update orders table to track credit usage
ALTER TABLE orders ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES user_subscriptions(id);

-- Indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_user_credits_expires_at ON user_credits(expires_at);
CREATE INDEX idx_user_credits_source ON user_credits(source_type, source_id);
CREATE INDEX idx_credit_pack_purchases_user_id ON credit_pack_purchases(user_id);
CREATE INDEX idx_credit_pack_purchases_stripe_id ON credit_pack_purchases(stripe_payment_intent_id);
CREATE INDEX idx_credit_usage_user_id ON credit_usage(user_id);
CREATE INDEX idx_credit_usage_created_at ON credit_usage(created_at);

-- Function to get current credit balance for a user
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    balance INTEGER;
BEGIN
    SELECT COALESCE(SUM(credits), 0)
    INTO balance
    FROM user_credits
    WHERE user_id = p_user_id
      AND (expires_at IS NULL OR expires_at > NOW())
      AND credits > 0;
    
    RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Function to expire credits
CREATE OR REPLACE FUNCTION expire_credits()
RETURNS void AS $$
BEGIN
    -- Mark expired credits
    UPDATE user_credits 
    SET credits = 0,
        transaction_type = 'expired',
        updated_at = NOW()
    WHERE expires_at <= NOW()
      AND credits > 0
      AND transaction_type != 'expired';
END;
$$ LANGUAGE plpgsql;

-- Function to spend credits (FIFO - oldest expiry first)
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
        
        -- Insert spending transaction
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
            -to_spend,
            'spent',
            credit_record.source_type,
            credit_record.source_id,
            credit_record.expires_at,
            p_description,
            p_metadata
        );

        -- Record usage
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

-- Row Level Security
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_pack_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own credit pack purchases" ON credit_pack_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own credit usage" ON credit_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Service role policies for backend operations
CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage credits" ON user_credits
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage credit pack purchases" ON credit_pack_purchases
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage credit usage" ON credit_usage
    FOR ALL USING (auth.role() = 'service_role'); 