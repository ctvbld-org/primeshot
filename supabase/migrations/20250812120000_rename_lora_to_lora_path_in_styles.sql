-- Rename column "lora" to "lora_path" in table public.styles (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'styles'
      AND column_name = 'lora'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'styles'
      AND column_name = 'lora_path'
  ) THEN
    ALTER TABLE public.styles RENAME COLUMN lora TO lora_path;
  END IF;
END
$$;


