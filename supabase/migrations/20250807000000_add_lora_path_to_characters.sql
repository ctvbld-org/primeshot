-- Add lora_path column to characters table for storing the path to trained LoRA models
-- This column will store the file path or URL to the trained LoRA model file
-- Used by the training system to track where the completed LoRA models are stored

ALTER TABLE characters 
ADD COLUMN lora_path TEXT;

-- Add comment explaining the purpose of this column
COMMENT ON COLUMN characters.lora_path IS 'Stores the file path/URL to the trained LoRA model for this character';

-- Grant permissions to service_role for training operations
-- This allows the training system to update the lora_path after training completes
GRANT SELECT, INSERT, UPDATE (lora_path) ON characters TO service_role;