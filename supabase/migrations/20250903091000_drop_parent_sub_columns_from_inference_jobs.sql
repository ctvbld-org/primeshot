-- Drop obsolete inference_jobs columns
-- parent_job_id uuid, sub_job_index int4, is_parent_job bool

ALTER TABLE public.inference_jobs DROP COLUMN IF EXISTS parent_job_id;
ALTER TABLE public.inference_jobs DROP COLUMN IF EXISTS sub_job_index;
ALTER TABLE public.inference_jobs DROP COLUMN IF EXISTS is_parent_job;


