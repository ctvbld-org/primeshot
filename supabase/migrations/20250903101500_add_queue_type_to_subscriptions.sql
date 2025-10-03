-- Add queue_type column to subscriptions to control GPU queue selection
-- Immutable migration: do not edit existing migrations

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS queue_type text
  CHECK (queue_type IN ('fast','slow'))
  NOT NULL DEFAULT 'fast';

-- Set basic plan to slow queue
UPDATE subscriptions
SET queue_type = 'slow'
WHERE name = 'basic' OR id = 1;


