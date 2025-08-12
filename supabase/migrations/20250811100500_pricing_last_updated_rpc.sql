-- RPC that returns a single last_updated timestamp across pricing-related tables
create or replace function get_pricing_last_updated()
returns text
language sql
as $$
  with t as (
    select greatest(
      coalesce((select max(updated_at) from subscriptions), 'epoch'::timestamptz),
      coalesce((select max(updated_at) from credit_costs), 'epoch'::timestamptz),
      coalesce((select max(updated_at) from inference_settings), 'epoch'::timestamptz)
    ) as ts
  )
  select to_char(ts, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') from t;
$$;

