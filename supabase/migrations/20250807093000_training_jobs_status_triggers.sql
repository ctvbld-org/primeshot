-- Ensure status-driven timestamps are set consistently for training_jobs
-- - started_at when status transitions to 'running'
-- - completed_at when status transitions to 'completed' or 'failed'

create or replace function public.training_jobs_status_timestamps()
returns trigger as $$
begin
  -- Set started_at only on transition into 'running' if not already set
  if (new.status = 'running'
      and (old.status is distinct from 'running')
      and new.started_at is null) then
    new.started_at := now();
  end if;

  -- Set completed_at only on first transition into a terminal state
  if ((new.status = 'completed' or new.status = 'failed')
      and (old.status is distinct from new.status)
      and new.completed_at is null) then
    new.completed_at := now();
  end if;

  return new;
end;
$$ language plpgsql;

-- Drop and recreate trigger to avoid duplicates
drop trigger if exists trg_training_jobs_status_timestamps on public.training_jobs;
create trigger trg_training_jobs_status_timestamps
before update on public.training_jobs
for each row
execute function public.training_jobs_status_timestamps();


