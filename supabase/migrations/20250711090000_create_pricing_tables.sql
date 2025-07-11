-- Create subscriptions table
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  original_price NUMERIC(10,2) NOT NULL,
  monthly_price NUMERIC(10,2) NOT NULL,
  yearly_price NUMERIC(10,2) NOT NULL,
  credits INTEGER NOT NULL,
  max_resolution TEXT NOT NULL,
  face_model_training_included INTEGER NOT NULL,
  concurrent_jobs INTEGER NOT NULL,
  max_face_models INTEGER NOT NULL,
  features JSONB,
  popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create credit_packs table
CREATE TABLE credit_packs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  validity_days INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create credit_costs table
CREATE TABLE credit_costs (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL, -- e.g., 'IMAGE_GENERATION_1K', 'IMAGE_GENERATION_2K', 'FACE_MODEL_TRAINING'
  value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
); 