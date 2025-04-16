-- Add 'compositions' to flow_stage enum for backward compatibility
ALTER TYPE public.flow_stage ADD VALUE IF NOT EXISTS 'compositions';

-- Add comment for documentation
COMMENT ON TYPE public.flow_stage IS 'Valid stages in the user flow. The value "compositions" is kept for compatibility; new code should use "shoot".'; 