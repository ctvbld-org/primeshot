-- Add gpu_type column to training_jobs
alter table public.training_jobs
add column if not exists gpu_type text;

comment on column public.training_jobs.gpu_type is 'GPU type used for the training run (e.g., B200, H200:2)';

