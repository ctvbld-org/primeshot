-- Seed subscriptions table
INSERT INTO subscriptions (name, display_name, description, original_price, monthly_price, yearly_price, credits, max_resolution, face_model_training_included, concurrent_jobs, max_face_models, features, popular)
VALUES
  ('basic', 'Basic', 'Includes 40 credits per month, plus 1 FaceModel (30 credits value).', 14, 9, 9, 40, '1K', 1, 1, 1, '["40 monthly credits","Up to 1K Resolution","1x FaceModel Included","1 concurrent job","Up to 1 FaceModel Storage","Up to 40 images per month"]', FALSE),
  ('standard', 'Standard', 'Includes 180 credits per month, plus 1 FaceModel (30 credits value).', 39, 29, 18, 180, '4K', 1, 2, 3, '["180 monthly credits","Up to 4K Resolution","1x FaceModel Included","2 concurrent jobs","Up to 3 FaceModel Storage","Up to 180×1K, 90×2K, or 60×4K images per month"]', TRUE),
  ('pro', 'Pro', 'Includes 450 credits per month, plus 3 FaceModel (90 credits value).', 79, 59, 39, 450, '4K', 3, 4, 8, '["450 monthly credits","Up to 4K Resolution","3x FaceModel Included","4 concurrent jobs","Up to 8 FaceModel Storage","Up to 450×1K, 225×2K, or 150×4K images per month"]', FALSE);

-- Seed credit_packs table
INSERT INTO credit_packs (name, credits, price, validity_days)
VALUES
  ('90 Credits', 90, 19, 60),
  ('180 Credits', 180, 32, 60),
  ('360 Credits', 360, 52, 60);

-- Seed credit_costs table
INSERT INTO credit_costs (type, value)
VALUES
  ('IMAGE_GENERATION_1K', 1),
  ('IMAGE_GENERATION_2K', 2),
  ('IMAGE_GENERATION_4K', 3),
  ('FACE_MODEL_TRAINING', 30); 