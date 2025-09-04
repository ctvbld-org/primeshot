-- Add settings_override JSONB column to inference_jobs to store admin overrides
-- This column is NULL when no overrides are provided

alter table if exists public.inference_jobs
add column if not exists settings_override jsonb;

comment on column public.inference_jobs.settings_override is 'Admin-provided settings overrides (e.g., character/style lora strengths). Null when not provided.';


