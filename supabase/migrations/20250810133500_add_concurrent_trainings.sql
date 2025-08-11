-- Add concurrent_trainings column to subscriptions and default to 2

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS concurrent_trainings integer;

UPDATE public.subscriptions SET concurrent_trainings = 2 WHERE concurrent_trainings IS NULL;

COMMENT ON COLUMN public.subscriptions.concurrent_trainings IS 'Per-user concurrent training jobs limit';


