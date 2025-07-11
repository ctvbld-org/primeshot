-- Seed subscriptions table
INSERT INTO subscriptions (name, display_name, description, original_price, monthly_price, yearly_price, credits, max_resolution, face_model_training_included, concurrent_jobs, max_face_models, features, popular)
VALUES
  ('basic', 'Basic', 'Includes 40 credits per month, plus 1 Face Model training (30 credits value).', 14, 9, 9, 40, '1K', 1, 1, 1, '["40 monthly credits","Standard image resolution (1K max)","Includes 1 Face Model training","1 concurrent job","1 Face Model slot","Up to 40 images per month"]', FALSE),
  ('standard', 'Standard', 'Includes 180 credits per month, plus 1 Face Model training (30 credits value).', 39, 29, 18, 180, '4K', 1, 2, 3, '["180 monthly credits","Ultra high image resolution (up to 4K)","Includes 1 Face Model training","2 concurrent jobs","3 Face Model slots","Up to 180×1K, 90×2K, or 60×4K images per month"]', TRUE),
  ('pro', 'Pro', 'Includes 450 credits per month, plus 3 Face Model trainings (90 credits value).', 89, 69, 39, 450, '4K', 3, 4, 8, '["450 monthly credits","Ultra high image resolution (up to 4K)","Includes 3 Face Model trainings","4 concurrent jobs","8 Face Model slots","Up to 450×1K, 225×2K, or 150×4K images per month"]', FALSE);

-- Seed credit_packs table
INSERT INTO credit_packs (name, credits, price, validity_days)
VALUES
  ('90 Credits', 90, 19, 60),
  ('180 Credits', 180, 32, 60),
  ('360 Credits', 360, 58, 60);

-- Seed credit_costs table
INSERT INTO credit_costs (type, value)
VALUES
  ('IMAGE_GENERATION_1K', 1),
  ('IMAGE_GENERATION_2K', 2),
  ('IMAGE_GENERATION_4K', 3),
  ('FACE_MODEL_TRAINING', 30); 