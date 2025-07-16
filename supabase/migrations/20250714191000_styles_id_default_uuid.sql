-- Migration: Set default value for styles.id to gen_random_uuid()
ALTER TABLE styles ALTER COLUMN id SET DEFAULT gen_random_uuid(); 