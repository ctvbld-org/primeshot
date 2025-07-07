-- Fix foreign key relationships for credit tables to reference public.users instead of auth.users
-- This ensures proper type generation and better schema consistency

-- Update user_credits table
ALTER TABLE user_credits 
DROP CONSTRAINT user_credits_user_id_fkey;

ALTER TABLE user_credits
ADD CONSTRAINT user_credits_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update credit_pack_purchases table  
ALTER TABLE credit_pack_purchases
DROP CONSTRAINT credit_pack_purchases_user_id_fkey;

ALTER TABLE credit_pack_purchases
ADD CONSTRAINT credit_pack_purchases_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update user_subscriptions table
ALTER TABLE user_subscriptions
DROP CONSTRAINT user_subscriptions_user_id_fkey;

ALTER TABLE user_subscriptions  
ADD CONSTRAINT user_subscriptions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update credit_usage table
ALTER TABLE credit_usage
DROP CONSTRAINT credit_usage_user_id_fkey;

ALTER TABLE credit_usage
ADD CONSTRAINT credit_usage_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
