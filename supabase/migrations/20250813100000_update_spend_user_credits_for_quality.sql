-- Recreate spend_user_credits to stop using deprecated `resolution` and store
-- quality, nb_takes, aspect_ratio via metadata/dedicated columns.

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
begin
  -- Insert credit usage; tolerate environments missing new columns
  begin
    insert into public.credit_usage (
      user_id, amount, usage_type, description,
      quality, nb_takes, aspect_ratio, metadata
    ) values (
      p_user_id, p_amount, p_usage_type, p_description,
      coalesce(p_metadata->>'quality', null),
      nullif(p_metadata->>'nb_takes','')::int,
      coalesce(p_metadata->>'aspect_ratio', null),
      p_metadata
    );
  exception when undefined_column then
    insert into public.credit_usage (
      user_id, amount, usage_type, description, metadata
    ) values (
      p_user_id, p_amount, p_usage_type, p_description, p_metadata
    );
  end;

  return query select true;
end;
$$;

grant execute on function public.spend_user_credits(uuid, int, text, text, jsonb) to service_role;


