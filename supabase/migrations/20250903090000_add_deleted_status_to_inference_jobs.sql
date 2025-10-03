-- Add 'deleted' to inference_jobs.status allowed values for soft delete
-- Safe: only alters CHECK constraint; no data changes

alter table public.inference_jobs
  drop constraint if exists inference_jobs_status_check;

alter table public.inference_jobs
  add constraint inference_jobs_status_check
  check (
    status = any (array[
      'initializing'::text,
      'queued'::text,
      'pending'::text,
      'running'::text,
      'completed'::text,
      'failed'::text,
      'deleted'::text
    ])
  );

-- Optional: ensure index still exists on status (noop if already present)
create index if not exists idx_inference_jobs_status on public.inference_jobs using btree (status);


