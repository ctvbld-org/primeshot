-- Create function to safely increment image_count in face_models table
-- This function handles the case where image_count might be NULL

CREATE OR REPLACE FUNCTION increment_image_count(face_model_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.face_models 
  SET 
    image_count = COALESCE(image_count, 0) + 1,
    updated_at = NOW()
  WHERE id = face_model_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_image_count(UUID) TO authenticated; 