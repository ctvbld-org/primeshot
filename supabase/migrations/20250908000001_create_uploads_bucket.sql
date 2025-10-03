-- Create uploads storage bucket for chunk storage
-- This migration creates the storage bucket needed for chunked uploads

-- Create the uploads bucket
INSERT INTO storage.buckets (id, name)
VALUES (
  'uploads',
  'uploads'
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the uploads bucket
-- Allow authenticated users to upload chunks
CREATE POLICY "Users can upload chunks" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'uploads' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'upload-chunks'
);

-- Allow authenticated users to read their own chunks
CREATE POLICY "Users can read their own chunks" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'upload-chunks'
);

-- Allow authenticated users to delete their own chunks
CREATE POLICY "Users can delete their own chunks" ON storage.objects
FOR DELETE USING (
  bucket_id = 'uploads' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'upload-chunks'
);

-- Allow service role to manage all objects (for cleanup)
CREATE POLICY "Service role can manage all upload objects" ON storage.objects
FOR ALL USING (
  bucket_id = 'uploads' AND
  auth.jwt() ->> 'role' = 'service_role'
);
