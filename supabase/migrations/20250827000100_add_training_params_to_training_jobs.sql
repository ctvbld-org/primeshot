-- Add training_params column to persist admin overrides for queued jobs
-- Immutable migration - do not modify once applied

begin;

alter table if exists public.training_jobs
  add column if not exists training_params jsonb;

comment on column public.training_jobs.training_params is 'Optional admin-provided training overrides (e.g., batch_size, min_steps, resize_size, rank)';

commit;


