-- Create image_processing_jobs table for tracking image processing operations
CREATE TABLE IF NOT EXISTS public.image_processing_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    upload_id UUID NOT NULL,
    user_id UUID NOT NULL,
    order_id UUID NOT NULL,
    raw_file_path TEXT NOT NULL,
    processed_file_path TEXT,
    original_filename TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.image_processing_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own processing jobs"
    ON public.image_processing_jobs
    FOR SELECT
    TO public
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own processing jobs"
    ON public.image_processing_jobs
    FOR INSERT
    TO public
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update job status"
    ON public.image_processing_jobs
    FOR UPDATE
    TO public
    USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_image_processing_jobs_user_id ON public.image_processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_image_processing_jobs_upload_id ON public.image_processing_jobs(upload_id);
CREATE INDEX IF NOT EXISTS idx_image_processing_jobs_order_id ON public.image_processing_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_image_processing_jobs_status ON public.image_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_image_processing_jobs_created_at ON public.image_processing_jobs(created_at);

-- Add foreign key constraints if the referenced tables exist
-- Note: We'll check for table existence before adding constraints
DO $$
BEGIN
    -- Add foreign key to users table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        ALTER TABLE public.image_processing_jobs 
        ADD CONSTRAINT fk_image_processing_jobs_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key to orders table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        ALTER TABLE public.image_processing_jobs 
        ADD CONSTRAINT fk_image_processing_jobs_order_id 
        FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key to upload_sessions table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'upload_sessions' AND table_schema = 'public') THEN
        ALTER TABLE public.image_processing_jobs 
        ADD CONSTRAINT fk_image_processing_jobs_upload_id 
        FOREIGN KEY (upload_id) REFERENCES public.upload_sessions(id) ON DELETE CASCADE;
    END IF;
END $$;
