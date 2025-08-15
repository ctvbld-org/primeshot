-- Restore spend_user_credits to also write a 'spent' transaction into user_credits
-- and continue inserting an analytics row into credit_usage.
-- Spent credits are stored as POSITIVE amounts with transaction_type='spent'.

drop function if exists public.spend_user_credits(uuid, int, text, text, jsonb);

create or replace function public.spend_user_credits(
  p_user_id uuid,
  p_amount int,
  p_usage_type text,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table(success boolean)
language plpgsql
security definer
as $$
declare
  v_quality text := null;
  v_nb_takes int := null;
  v_job_id uuid := null;
begin
  -- Extract structured fields for credit_usage
  v_quality := nullif(p_metadata->>'quality','');
  v_nb_takes := nullif(p_metadata->>'nb_takes','')::int;
  v_job_id := nullif(p_metadata->>'job_id','')::uuid;

  -- 1) Record a spending transaction in user_credits (positive value; direction via transaction_type)
  insert into public.user_credits (
    user_id, credits, transaction_type, source_type, source_id, description, metadata
  ) values (
    p_user_id, p_amount, 'spent', 'inference', null, coalesce(p_description, p_usage_type), coalesce(p_metadata, '{}'::jsonb)
  );

  -- 2) Record analytics in credit_usage
  insert into public.credit_usage (
    user_id, credits_used, usage_type, quality, nb_takes, job_id, metadata
  ) values (
    p_user_id, p_amount, p_usage_type, v_quality, v_nb_takes, v_job_id, coalesce(p_metadata, '{}'::jsonb)
  );

  return query select true;
end;
$$;

grant execute on function public.spend_user_credits(uuid, int, text, text, jsonb) to service_role;


