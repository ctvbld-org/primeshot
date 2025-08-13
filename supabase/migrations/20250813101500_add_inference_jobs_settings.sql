-- Add missing columns used by inference-create EF

alter table public.inference_jobs
  add column if not exists quality text,
  add column if not exists nb_takes integer,
  add column if not exists aspect_ratio text,
  add column if not exists queue_type text,
  add column if not exists credits_spent integer,
  add column if not exists modal_job_id text,
  add column if not exists error_message text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Optional constraints (commented for flexibility)
-- alter table public.inference_jobs
--   add constraint chk_inference_jobs_nb_takes_positive check (nb_takes is null or nb_takes > 0);



