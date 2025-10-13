-- Normalize language codes from ISO format to country codes
-- Convert ISO format (en-GB, en-US, fr-FR) to country codes (gb, us, fr)

-- Update user_settings.preferred_language to use country codes
UPDATE public.user_settings
SET 
  preferred_language = CASE
    -- English variants
    WHEN preferred_language IN ('en', 'en-GB', 'en-UK') THEN 'gb'
    WHEN preferred_language = 'en-US' THEN 'us'
    -- Other languages (normalize to country code)
    WHEN preferred_language LIKE 'fr%' THEN 'fr'
    WHEN preferred_language LIKE 'es%' THEN 'es'
    WHEN preferred_language LIKE 'de%' THEN 'de'
    WHEN preferred_language LIKE 'it%' THEN 'it'
    WHEN preferred_language LIKE 'pt%' THEN 'pt'
    WHEN preferred_language LIKE 'nl%' THEN 'nl'
    WHEN preferred_language LIKE 'zh%' THEN 'cn'
    WHEN preferred_language LIKE 'ja%' THEN 'jp'
    -- Already in correct format
    WHEN preferred_language IN ('us', 'gb', 'fr', 'es', 'de', 'it', 'pt', 'nl', 'cn', 'jp') THEN preferred_language
    -- Default to us for any unknown format
    ELSE 'us'
  END,
  updated_at = now()
WHERE 
  preferred_language IS NOT NULL
  AND preferred_language NOT IN ('us', 'gb', 'fr', 'es', 'de', 'it', 'pt', 'nl', 'cn', 'jp');

-- Add a check constraint to ensure only valid country codes are stored
ALTER TABLE public.user_settings
DROP CONSTRAINT IF EXISTS user_settings_preferred_language_check;

ALTER TABLE public.user_settings
ADD CONSTRAINT user_settings_preferred_language_check 
CHECK (preferred_language IN ('us', 'gb', 'cn', 'es', 'fr', 'pt', 'de', 'jp', 'it', 'nl') OR preferred_language IS NULL);

-- Add comment documenting the language code format
COMMENT ON COLUMN public.user_settings.preferred_language IS 'User preferred language using country codes: us, gb, cn, es, fr, pt, de, jp, it, nl';

