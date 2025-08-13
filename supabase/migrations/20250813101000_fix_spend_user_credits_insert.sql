-- Align spend_user_credits with current credit_usage table schema
-- Table columns: user_id, credits_used, usage_type, quality, nb_takes, job_id, metadata, created_at

drop function if exists public.spend_user_credits(uuid, int, text, text, jsonb);

create function public.spend_user_credits(
  p_user_id uuid,
  p_amount int,
  p_usage_type text,
  p_description text,
  p_metadata jsonb
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
  v_quality := nullif(p_metadata->>'quality','');
  v_nb_takes := nullif(p_metadata->>'nb_takes','')::int;
  v_job_id := nullif(p_metadata->>'job_id','')::uuid;

  insert into public.credit_usage (
    user_id, credits_used, usage_type, quality, nb_takes, job_id, metadata
  ) values (
    p_user_id, p_amount, p_usage_type, v_quality, v_nb_takes, v_job_id, coalesce(p_metadata, '{}'::jsonb)
  );

  return query select true;
end;
$$;

grant execute on function public.spend_user_credits(uuid, int, text, text, jsonb) to service_role;


