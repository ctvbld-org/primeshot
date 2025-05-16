-- Create upload_sessions table to track overall upload progress
CREATE TABLE IF NOT EXISTS public.upload_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  total_chunks INTEGER NOT NULL,
  completed_chunks INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  final_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create upload_chunks table to track individual chunks
CREATE TABLE IF NOT EXISTS public.upload_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.upload_sessions(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, chunk_index)
);

-- Add RLS policies
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_chunks ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own upload sessions
CREATE POLICY "Users can view their own upload sessions"
  ON public.upload_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own upload sessions"
  ON public.upload_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own upload sessions"
  ON public.upload_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own upload sessions"
  ON public.upload_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Users can manage chunks for their own upload sessions
CREATE POLICY "Users can view chunks for their upload sessions"
  ON public.upload_chunks
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.upload_sessions
    WHERE id = upload_chunks.session_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert chunks for their upload sessions"
  ON public.upload_chunks
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.upload_sessions
    WHERE id = upload_chunks.session_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update chunks for their upload sessions"
  ON public.upload_chunks
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.upload_sessions
    WHERE id = upload_chunks.session_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete chunks for their upload sessions"
  ON public.upload_chunks
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.upload_sessions
    WHERE id = upload_chunks.session_id
    AND user_id = auth.uid()
  )); 