-- Migration: create RPC calculate_user_credit_balance and RLS policies for new credit tables

-- 1. RPC Helper -----------------------------------------------------------
create or replace function public.calculate_user_credit_balance(user_uuid uuid)
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
grant execute on function public.calculate_user_credit_balance(uuid) to authenticated;

-- 2. RLS Policies ---------------------------------------------------------
-- user_credits ------------------------------------------------------------
alter table public.user_credits enable row level security;

-- Select own rows
create policy "Select own credits" on public.user_credits
for select
using (auth.uid() = user_id);

-- Insert: only service role (handled by backend code), no policy

-- credit_pack_purchases ---------------------------------------------------
alter table public.credit_pack_purchases enable row level security;
create policy "Select own credit pack purchases" on public.credit_pack_purchases
for select
using (auth.uid() = user_id);

-- user_subscriptions ------------------------------------------------------
alter table public.user_subscriptions enable row level security;
create policy "Select own subscription" on public.user_subscriptions
for select
using (auth.uid() = user_id); 