-- Fix RLS policies for credit system tables
-- Ensures service role can perform webhook operations properly
-- This migration runs after credit system and RPC functions are created

-- Drop existing conflicting policies and recreate clean service role policies
DROP POLICY IF EXISTS "Service role can manage credits" ON user_credits;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON user_subscriptions; 
DROP POLICY IF EXISTS "Service role can manage credit pack purchases" ON credit_pack_purchases;

-- Recreate service role policies with explicit permissions
CREATE POLICY "Service role full access to user_credits" ON user_credits
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to user_subscriptions" ON user_subscriptions
    FOR ALL
    TO service_role  
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to credit_pack_purchases" ON credit_pack_purchases
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Ensure service role has necessary grants for tables
GRANT ALL ON TABLE user_credits TO service_role;
GRANT ALL ON TABLE user_subscriptions TO service_role;
GRANT ALL ON TABLE credit_pack_purchases TO service_role;
GRANT ALL ON TABLE credit_usage TO service_role;

-- Grant execute permissions for RPC functions (only if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_credit_balance') THEN
        GRANT EXECUTE ON FUNCTION get_user_credit_balance(UUID) TO service_role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_user_credit_balance') THEN
        GRANT EXECUTE ON FUNCTION calculate_user_credit_balance(UUID) TO service_role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'spend_user_credits') THEN
        GRANT EXECUTE ON FUNCTION spend_user_credits(UUID, INTEGER, TEXT, TEXT, JSONB) TO service_role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'expire_credits') THEN
        GRANT EXECUTE ON FUNCTION expire_credits() TO service_role;
    END IF;
END $$; 