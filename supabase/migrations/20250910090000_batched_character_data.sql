-- Batched character data RPCs
-- 1) get_uploaded_image_counts(character_ids uuid[]) -> (character_id uuid, uploaded_count int)
-- 2) get_active_training_jobs() -> latest active job per character for current auth.uid()

-- Ensure auth extension is available (usually present in Supabase)
-- create extension if not exists pgjwt; -- not needed here

-- 1) Aggregated uploaded image counts for a list of character ids, scoped to the current user
create or replace function public.get_uploaded_image_counts(character_ids uuid[])
returns table (
  character_id uuid,
  uploaded_count integer
)
language sql
stable
security invoker
as $$
  select ui.character_id, count(*)::int as uploaded_count
  from public.uploaded_images ui
  join public.characters c on c.id = ui.character_id
  where ui.character_id = any(character_ids)
    and c.user_id = auth.uid()
  group by ui.character_id
  order by ui.character_id;
$$;

comment on function public.get_uploaded_image_counts(uuid[])
  is 'Returns uploaded image counts per character for the provided ids, scoped to the current authenticated user via auth.uid().';

-- 2) Latest active training job per character for the current user
-- Active statuses: initializing, queued, pending, running
create or replace function public.get_active_training_jobs()
returns table (
  id uuid,
  character_id uuid,
  user_id uuid,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  modal_job_id text,
  retry_after timestamptz,
  retry_count integer
)
language sql
stable
security invoker
as $$
  select distinct on (tj.character_id)
    tj.id,
    tj.character_id,
    tj.user_id,
    tj.status,
    tj.created_at,
    tj.updated_at,
    tj.modal_job_id,
    tj.retry_after,
    tj.retry_count
  from public.training_jobs tj
  where tj.user_id = auth.uid()
    and tj.status in ('initializing','queued','pending','running')
  order by tj.character_id, tj.created_at desc;
$$;

comment on function public.get_active_training_jobs()
  is 'Returns the latest active training job per character for the current authenticated user.';


