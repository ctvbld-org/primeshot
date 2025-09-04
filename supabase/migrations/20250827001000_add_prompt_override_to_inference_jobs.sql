-- Add prompt_override column to inference_jobs to persist admin overrides across queue/retries
-- Immutable migration

begin;

alter table if exists public.inference_jobs
  add column if not exists prompt_override jsonb;

comment on column public.inference_jobs.prompt_override is 'Optional admin-provided prompt override: { enabled: boolean, prompt: string }';

commit;


