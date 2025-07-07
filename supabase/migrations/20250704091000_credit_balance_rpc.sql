-- Migration: create RPC calculate_user_credit_balance and RLS policies for new credit tables
-- Rollback: 
-- DROP FUNCTION IF EXISTS public.calculate_user_credit_balance(uuid);
-- REVOKE EXECUTE ON FUNCTION public.calculate_user_credit_balance(uuid) FROM authenticated;
-- ALTER TABLE public.user_credits DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.credit_pack_purchases DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_subscriptions DISABLE ROW LEVEL SECURITY;

-- 1. RPC Helper -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_user_credit_balance(user_uuid uuid)
returns integer
language sql
security definer
as $$
  select coalesce(
    sum(
      case
        when transaction_type = 'earned' then credits
        when transaction_type = 'spent'  then -credits
        when transaction_type = 'expired' then 0
        else 0
      end
    ), 0)
  from public.user_credits
  where user_id = user_uuid
    and (expires_at is null or expires_at > now());
$$;

-- Grant execute to authenticated users (frontend) -------------------------
GRANT EXECUTE ON FUNCTION public.calculate_user_credit_balance(uuid) TO authenticated;

-- 2. RLS Policies ---------------------------------------------------------
-- user_credits ------------------------------------------------------------
ALTER TABLE IF EXISTS public.user_credits ENABLE ROW LEVEL SECURITY;

-- Select own rows
DROP POLICY IF EXISTS "Select own credits" ON public.user_credits;
CREATE POLICY "Select own credits" ON public.user_credits
for select
using (auth.uid() = user_id);

-- Service role policies will be handled in subsequent migration

-- credit_pack_purchases ---------------------------------------------------
ALTER TABLE IF EXISTS public.credit_pack_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Select own credit pack purchases" ON public.credit_pack_purchases;
CREATE POLICY "Select own credit pack purchases" ON public.credit_pack_purchases
for select
using (auth.uid() = user_id);

-- user_subscriptions ------------------------------------------------------
ALTER TABLE IF EXISTS public.user_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Select own subscription" ON public.user_subscriptions;
CREATE POLICY "Select own subscription" ON public.user_subscriptions
for select
using (auth.uid() = user_id); 