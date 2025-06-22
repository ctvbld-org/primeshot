-- Create face model workflow tables and related infrastructure
-- This migration creates the complete face model workflow system

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Create face_models table
CREATE TABLE IF NOT EXISTS public.face_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'training', 'ready', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_jobs table
CREATE TABLE IF NOT EXISTS public.training_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  face_model_id UUID NOT NULL REFERENCES public.face_models(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  progress FLOAT DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
  log_url TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inference_jobs table
CREATE TABLE IF NOT EXISTS public.inference_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  face_model_id UUID NOT NULL REFERENCES public.face_models(id) ON DELETE CASCADE,
  style_id TEXT REFERENCES public.styles(id) ON DELETE SET NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  progress FLOAT DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Face models indexes
CREATE INDEX IF NOT EXISTS idx_face_models_user_id ON public.face_models(user_id);
CREATE INDEX IF NOT EXISTS idx_face_models_status ON public.face_models(status);
CREATE INDEX IF NOT EXISTS idx_face_models_created_at ON public.face_models(created_at DESC);

-- Training jobs indexes
CREATE INDEX IF NOT EXISTS idx_training_jobs_user_id ON public.training_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_training_jobs_face_model_id ON public.training_jobs(face_model_id);
CREATE INDEX IF NOT EXISTS idx_training_jobs_status ON public.training_jobs(status);
CREATE INDEX IF NOT EXISTS idx_training_jobs_created_at ON public.training_jobs(created_at DESC);

-- Inference jobs indexes
CREATE INDEX IF NOT EXISTS idx_inference_jobs_user_id ON public.inference_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_inference_jobs_face_model_id ON public.inference_jobs(face_model_id);
CREATE INDEX IF NOT EXISTS idx_inference_jobs_style_id ON public.inference_jobs(style_id);
CREATE INDEX IF NOT EXISTS idx_inference_jobs_status ON public.inference_jobs(status);
CREATE INDEX IF NOT EXISTS idx_inference_jobs_created_at ON public.inference_jobs(created_at DESC);

-- =====================================================
-- 3. CREATE UPDATE TRIGGERS FOR TIMESTAMPS
-- =====================================================

-- Create or replace the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for all tables
DROP TRIGGER IF EXISTS update_face_models_updated_at ON public.face_models;
CREATE TRIGGER update_face_models_updated_at
  BEFORE UPDATE ON public.face_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_jobs_updated_at ON public.training_jobs;
CREATE TRIGGER update_training_jobs_updated_at
  BEFORE UPDATE ON public.training_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_inference_jobs_updated_at ON public.inference_jobs;
CREATE TRIGGER update_inference_jobs_updated_at
  BEFORE UPDATE ON public.inference_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 4. CREATE ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.face_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inference_jobs ENABLE ROW LEVEL SECURITY;

-- Face models policies
DROP POLICY IF EXISTS "Users can view their own face models" ON public.face_models;
CREATE POLICY "Users can view their own face models" ON public.face_models
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own face models" ON public.face_models;
CREATE POLICY "Users can create their own face models" ON public.face_models
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own face models" ON public.face_models;
CREATE POLICY "Users can update their own face models" ON public.face_models
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own face models" ON public.face_models;
CREATE POLICY "Users can delete their own face models" ON public.face_models
  FOR DELETE USING (auth.uid() = user_id);

-- Training jobs policies
DROP POLICY IF EXISTS "Users can view their own training jobs" ON public.training_jobs;
CREATE POLICY "Users can view their own training jobs" ON public.training_jobs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own training jobs" ON public.training_jobs;
CREATE POLICY "Users can create their own training jobs" ON public.training_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own training jobs" ON public.training_jobs;
CREATE POLICY "Users can update their own training jobs" ON public.training_jobs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own training jobs" ON public.training_jobs;
CREATE POLICY "Users can delete their own training jobs" ON public.training_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Inference jobs policies
DROP POLICY IF EXISTS "Users can view their own inference jobs" ON public.inference_jobs;
CREATE POLICY "Users can view their own inference jobs" ON public.inference_jobs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own inference jobs" ON public.inference_jobs;
CREATE POLICY "Users can create their own inference jobs" ON public.inference_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own inference jobs" ON public.inference_jobs;
CREATE POLICY "Users can update their own inference jobs" ON public.inference_jobs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own inference jobs" ON public.inference_jobs;
CREATE POLICY "Users can delete their own inference jobs" ON public.inference_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

-- Grant basic permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.face_models TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inference_jobs TO authenticated;

-- Grant all permissions to service role for admin operations
GRANT ALL ON public.face_models TO service_role;
GRANT ALL ON public.training_jobs TO service_role;
GRANT ALL ON public.inference_jobs TO service_role;

-- =====================================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.face_models IS 'Stores face model data for AI training and inference';
COMMENT ON COLUMN public.face_models.status IS 'Current status: queued, training, ready, failed';
COMMENT ON COLUMN public.face_models.thumbnail_url IS 'URL to representative thumbnail image';

COMMENT ON TABLE public.training_jobs IS 'Tracks AI model training jobs and their progress';
COMMENT ON COLUMN public.training_jobs.progress IS 'Training progress from 0.0 to 1.0';
COMMENT ON COLUMN public.training_jobs.log_url IS 'URL to training logs for debugging';

COMMENT ON TABLE public.inference_jobs IS 'Tracks AI inference jobs for image generation';
COMMENT ON COLUMN public.inference_jobs.style_id IS 'Optional reference to style configuration';
COMMENT ON COLUMN public.inference_jobs.progress IS 'Inference progress from 0.0 to 1.0';
COMMENT ON COLUMN public.inference_jobs.error_message IS 'Detailed error message if job failed'; 