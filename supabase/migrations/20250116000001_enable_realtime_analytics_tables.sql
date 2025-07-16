-- Migration: Enable realtime on analytics tables for admin dashboard
-- Date: 2025-01-16
-- Purpose: Enable realtime subscriptions on tables used by admin dashboard analytics

-- Enable realtime on revenue-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE credit_pack_purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE user_credits;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;

-- Enable realtime on dashboard analytics tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE inference_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE training_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE waitlist;

-- Enable realtime on pricing configuration tables
ALTER PUBLICATION supabase_realtime ADD TABLE credit_packs;
ALTER PUBLICATION supabase_realtime ADD TABLE credit_costs;

-- Add comments for documentation
COMMENT ON PUBLICATION supabase_realtime IS 'Realtime publication includes analytics tables for admin dashboard real-time updates';

-- Note: Enabling realtime on tables has zero cost when no clients are connected
-- Only actual WebSocket connections and messages sent incur costs 