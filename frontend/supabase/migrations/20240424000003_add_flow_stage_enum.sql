-- Create flow_stage enum type
CREATE TYPE public.flow_stage AS ENUM ('shoot', 'payment', 'upload', 'review', 'dashboard');

-- Update user_progress table to use the enum
ALTER TABLE public.user_progress 
  ALTER COLUMN current_stage TYPE public.flow_stage USING current_stage::public.flow_stage,
  ALTER COLUMN completed_stages TYPE public.flow_stage[] USING completed_stages::public.flow_stage[];

COMMENT ON TYPE public.flow_stage IS 'Represents the different stages in the headshot generation workflow'; 