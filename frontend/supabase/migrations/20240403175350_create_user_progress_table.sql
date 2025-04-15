-- Create enum for flow stages if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.flow_stage AS ENUM (
    'compositions',
    'upload',
    'review',
    'payment',
    'dashboard'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_stage flow_stage NOT NULL,
  completed_stages flow_stage[] NOT NULL DEFAULT '{}',
  stage_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create completed_user_journeys table for analytics
CREATE TABLE public.completed_user_journeys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_data JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX user_progress_user_id_idx ON public.user_progress(user_id);
CREATE INDEX completed_user_journeys_user_id_idx ON public.completed_user_journeys(user_id);

-- Set up RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_user_journeys ENABLE ROW LEVEL SECURITY;

-- Policies for user_progress
CREATE POLICY "Users can view their own progress"
  ON public.user_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.user_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON public.user_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for completed_user_journeys
CREATE POLICY "Users can view their own completed journeys"
  ON public.completed_user_journeys
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed journeys"
  ON public.completed_user_journeys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER handle_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at(); 