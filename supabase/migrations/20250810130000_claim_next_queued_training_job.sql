-- Atomically claim the next queued training job with per-user limit enforcement
-- Returns the claimed job row, or NULL if none available/eligible

create or replace function public.claim_next_queued_training_job()
returns public.training_jobs
language plpgsql
security definer
as $$
declare
  v_job public.training_jobs%rowtype;
  v_concurrent_limit int := 1;
  v_active_count int := 0;
  v_plan text;
begin
  -- Pick the oldest eligible queued job and lock it to avoid races
  select * into v_job
  from public.training_jobs j
  where j.status = 'queued'
    and (j.retry_after is null or j.retry_after <= now())
  order by j.created_at asc
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  -- Get user's plan to determine concurrent limit
  select s.concurrent_jobs into v_concurrent_limit
  from public.user_subscriptions us
  join public.subscriptions s on s.name = us.plan_name
  where us.user_id = v_job.user_id and us.status = 'active'
  limit 1;

  if v_concurrent_limit is null then
    v_concurrent_limit := 1;
  end if;

  -- Count user's currently active jobs
  select count(1) into v_active_count
  from public.training_jobs
  where user_id = v_job.user_id
    and status in ('initializing','pending','running');

  if v_active_count >= v_concurrent_limit then
    -- Defer this job briefly to avoid hot looping
    update public.training_jobs
      set retry_after = now() + interval '60 seconds',
          updated_at = now()
      where id = v_job.id;
    return null;
  end if;

  -- Claim the job by setting it to initializing (owned by this runner)
  update public.training_jobs
    set status = 'initializing',
        updated_at = now()
    where id = v_job.id
    returning * into v_job;

  return v_job;
end;
$$;

grant execute on function public.claim_next_queued_training_job() to service_role;


