-- Add soft delete functionality to existing face_models status column
-- This modifies the existing status constraint to include 'deleted' as a valid value
-- alongside the existing training statuses: 'queued', 'training', 'ready', 'failed'

-- Drop the existing status constraint
ALTER TABLE face_models DROP CONSTRAINT IF EXISTS face_models_status_check;

-- Add new constraint that includes 'deleted' for soft delete functionality
ALTER TABLE face_models 
ADD CONSTRAINT face_models_status_check 
CHECK (status IN ('queued', 'training', 'ready', 'failed', 'deleted'));

-- Add updated_at column if it doesn't exist (for tracking when status changes)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'face_models' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE face_models ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        
        -- Create trigger to auto-update updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $update_trigger$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $update_trigger$ LANGUAGE plpgsql;

        CREATE TRIGGER update_face_models_updated_at
            BEFORE UPDATE ON face_models
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add comment explaining the soft delete approach
COMMENT ON COLUMN face_models.status IS 'Status: queued/training/ready/failed for training workflow, deleted for soft delete. Allows keeping training_jobs records for analytics.'; 

-- Grant necessary permissions to service_role for cleanup operations
-- The service_role needs to be able to delete images during face model cleanup
GRANT SELECT, DELETE ON TABLE "public"."images" TO "service_role";

-- Add comment explaining why service_role needs these permissions
COMMENT ON TABLE "public"."images" IS 'Stores user-uploaded images and their metadata. Service role has delete permissions for cleanup operations during training failures.'; 