-- Remove old constraint
ALTER TABLE public.compositions
DROP CONSTRAINT IF EXISTS valid_settings;

-- Add updated constraint without pose requirement
ALTER TABLE public.compositions
ADD CONSTRAINT valid_settings CHECK (
  jsonb_typeof(settings->'style') = 'string'
  AND (settings->>'style') IN ('professional', 'casual', 'creative')
  AND jsonb_typeof(settings->'background') = 'string'
  AND (settings->>'background') IN ('plain', 'office', 'outdoor', 'custom')
  AND jsonb_typeof(settings->'lighting') = 'string'
  AND (settings->>'lighting') IN ('studio', 'natural', 'dramatic')
);

-- Add comment for documentation
COMMENT ON CONSTRAINT valid_settings ON public.compositions IS 'Ensures composition settings contain valid style, background, and lighting values'; 