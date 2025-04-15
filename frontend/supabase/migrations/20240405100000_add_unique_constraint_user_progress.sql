-- Add UNIQUE constraint to user_id in user_progress table

-- First, create a temporary table to identify duplicates and keep only the most recent record
CREATE TEMP TABLE temp_user_progress AS
WITH ranked_progress AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY last_active_at DESC, id DESC) as rn
  FROM public.user_progress
)
SELECT id
FROM ranked_progress
WHERE rn > 1;

-- Delete the duplicate rows, keeping only the most recent one for each user
DELETE FROM public.user_progress
WHERE id IN (SELECT id FROM temp_user_progress);

-- Now, safely add the unique constraint
ALTER TABLE public.user_progress
ADD CONSTRAINT user_progress_user_id_unique UNIQUE (user_id);

COMMENT ON CONSTRAINT user_progress_user_id_unique ON public.user_progress IS 'Ensures that each user can only have one progress record.';

-- Drop the temporary table
DROP TABLE temp_user_progress; 