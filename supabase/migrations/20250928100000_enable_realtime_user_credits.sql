-- Enable real-time for user_credits table to ensure credit balance updates work properly
-- This migration ensures that real-time subscriptions work correctly for credit balance updates

-- Enable replica identity for user_credits table (required for real-time updates)
ALTER TABLE public.user_credits REPLICA IDENTITY FULL;

-- Try to add tables to real-time publication, ignore if already exists
DO $$
BEGIN
    -- Add user_credits table to publication if not already added
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, skip
        NULL;
    END;
    
    -- Add credit_usage table to publication if not already added
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_usage;
        ALTER TABLE public.credit_usage REPLICA IDENTITY FULL;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, just set replica identity
        ALTER TABLE public.credit_usage REPLICA IDENTITY FULL;
    END;
    
    -- Add credit_pack_purchases table to publication if not already added
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_pack_purchases;
        ALTER TABLE public.credit_pack_purchases REPLICA IDENTITY FULL;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, just set replica identity
        ALTER TABLE public.credit_pack_purchases REPLICA IDENTITY FULL;
    END;
END $$;

-- Add a comment to document this migration
COMMENT ON TABLE public.user_credits IS 'Real-time enabled for credit balance updates';
COMMENT ON TABLE public.credit_usage IS 'Real-time enabled for credit usage tracking';
COMMENT ON TABLE public.credit_pack_purchases IS 'Real-time enabled for credit pack purchase tracking';
