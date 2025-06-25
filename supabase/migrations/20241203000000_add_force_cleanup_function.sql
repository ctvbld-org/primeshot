-- Create function to force cleanup upload sessions and chunks
CREATE OR REPLACE FUNCTION public.force_cleanup_upload_session(session_id UUID)
RETURNS VOID AS $$
BEGIN
  -- First delete chunks (explicit deletion before session)
  DELETE FROM public.upload_chunks WHERE upload_chunks.session_id = force_cleanup_upload_session.session_id;
  
  -- Then delete the session
  DELETE FROM public.upload_sessions WHERE id = force_cleanup_upload_session.session_id;
  
  -- Log the cleanup
  RAISE NOTICE 'Force cleaned up upload session: %', session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.force_cleanup_upload_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_cleanup_upload_session(UUID) TO service_role;

-- Add comment
COMMENT ON FUNCTION public.force_cleanup_upload_session(UUID) IS 'Force cleanup of upload session and all related chunks when normal cleanup fails'; 