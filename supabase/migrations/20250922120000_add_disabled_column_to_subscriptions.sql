-- Add disabled column to subscriptions table to allow disabling subscription tiers
-- Immutable migration: do not edit existing migrations

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS disabled boolean
  NOT NULL DEFAULT false;

-- Add index for performance when filtering disabled subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_disabled ON subscriptions(disabled);

-- Add comment for clarity
COMMENT ON COLUMN subscriptions.disabled IS 'Whether this subscription tier is disabled and should not be available for new subscriptions';
