-- Create flow_stage enum type
CREATE TYPE public.flow_stage AS ENUM ('shoot', 'payment', 'upload', 'review', 'dashboard');
COMMENT ON TYPE public.flow_stage IS 'Represents the different stages in the headshot generation workflow';

-- Create tables
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  gender TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE styles (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT,
  name TEXT NOT NULL,
  settings JSONB NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE style_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  preview_images JSONB NOT NULL DEFAULT '[]',
  available_genders TEXT[] NOT NULL DEFAULT '{}',
  available_backgrounds TEXT[] NOT NULL DEFAULT '{}',
  available_clothing TEXT[] NOT NULL DEFAULT '{}',
  available_clothing_colors TEXT[] NOT NULL DEFAULT '{}',
  translations jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE style_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL DEFAULT '[]',
  translations jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL,
  amount integer,
  currency text,
  payment_intent_id text,
  payment_status text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  idempotency_key text,
  checkout_session_id text
);

CREATE TABLE images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  file_name text,
  file_size bigint,
  mime_type text,
  dimensions jsonb,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_stage flow_stage NOT NULL,
  completed_stages flow_stage[] NOT NULL DEFAULT '{}',
  stage_data JSONB,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);

CREATE TABLE completed_user_journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  journey_data JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  RAISE LOG 'Creating new user with id: %, email: %', NEW.id, NEW.email;
  
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  RAISE LOG 'User created successfully in public.users';
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error creating user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_user_journeys ENABLE ROW LEVEL SECURITY;
 
-- Create RLS policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow insert during signup"
  ON users FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can view their own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow public read access to style_configs"
  ON style_configs FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Allow public read access to style_options"
  ON style_options FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can manage their own styles"
  ON styles FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own orders"
  ON orders FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own images"
  ON images FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress"
  ON user_progress FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own completed journeys"
  ON completed_user_journeys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_styles_updated_at
  BEFORE UPDATE ON styles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_style_configs_updated_at
  BEFORE UPDATE ON style_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_style_options_updated_at
  BEFORE UPDATE ON style_options
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_images_updated_at
  BEFORE UPDATE ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_completed_user_journeys_updated_at
  BEFORE UPDATE ON completed_user_journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 

-- Add descriptions to all tables and their columns

-- Users table
COMMENT ON TABLE users IS 'Stores user profile information and authentication details';
COMMENT ON COLUMN users.id IS 'Primary key, references auth.users';
COMMENT ON COLUMN users.email IS 'User''s email address';
COMMENT ON COLUMN users.full_name IS 'User''s full name';
COMMENT ON COLUMN users.avatar_url IS 'URL to user''s profile picture';
COMMENT ON COLUMN users.gender IS 'User''s gender preference for headshot generation';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user profile was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when the user profile was last updated';

-- Sessions table
COMMENT ON TABLE sessions IS 'Stores user session information for authentication';
COMMENT ON COLUMN sessions.id IS 'Unique identifier for the session';
COMMENT ON COLUMN sessions.user_id IS 'Reference to the user who owns this session';
COMMENT ON COLUMN sessions.created_at IS 'Timestamp when the session was created';
COMMENT ON COLUMN sessions.updated_at IS 'Timestamp when the session was last updated';
COMMENT ON COLUMN sessions.expires_at IS 'Timestamp when the session expires';
COMMENT ON COLUMN sessions.last_accessed_at IS 'Timestamp when the session was last accessed';

-- Styles table
COMMENT ON TABLE styles IS 'Stores user-created headshot style configurations';
COMMENT ON COLUMN styles.id IS 'Unique identifier for the style';
COMMENT ON COLUMN styles.user_id IS 'Reference to the user who created the style';
COMMENT ON COLUMN styles.order_id IS 'Reference to the order this style is associated with';
COMMENT ON COLUMN styles.name IS 'Name of the style';
COMMENT ON COLUMN styles.settings IS 'JSON configuration for the style settings';
COMMENT ON COLUMN styles.status IS 'Current status of the style (draft, active, etc.)';
COMMENT ON COLUMN styles.created_at IS 'Timestamp when the style was created';
COMMENT ON COLUMN styles.updated_at IS 'Timestamp when the style was last updated';

-- Style configs table
COMMENT ON TABLE style_configs IS 'Stores predefined style configuration templates';
COMMENT ON COLUMN style_configs.id IS 'Unique identifier for the style config';
COMMENT ON COLUMN style_configs.name IS 'Name of the style configuration';
COMMENT ON COLUMN style_configs.tagline IS 'Short description or tagline for the style';
COMMENT ON COLUMN style_configs.description IS 'Detailed description of the style';
COMMENT ON COLUMN style_configs.preview_images IS 'JSON array of preview image URLs';
COMMENT ON COLUMN style_configs.available_genders IS 'Array of supported gender options';
COMMENT ON COLUMN style_configs.available_backgrounds IS 'Array of available background options';
COMMENT ON COLUMN style_configs.available_clothing IS 'Array of available clothing options';
COMMENT ON COLUMN style_configs.available_clothing_colors IS 'Array of available clothing color options';
COMMENT ON COLUMN style_configs.translations IS 'JSON object containing localized strings for name, tagline, and description keyed by language code';
COMMENT ON COLUMN style_configs.created_at IS 'Timestamp when the config was created';
COMMENT ON COLUMN style_configs.updated_at IS 'Timestamp when the config was last updated';

-- Style options table
COMMENT ON TABLE style_options IS 'Stores available options for different style categories';
COMMENT ON COLUMN style_options.id IS 'Unique identifier for the style option';
COMMENT ON COLUMN style_options.category IS 'Category of the style option (e.g., background, clothing)';
COMMENT ON COLUMN style_options.label IS 'Display label for the option';
COMMENT ON COLUMN style_options.description IS 'Detailed description of the option';
COMMENT ON COLUMN style_options.options IS 'JSON array of specific options within this category';
COMMENT ON COLUMN style_options.translations IS 'JSON object containing localized strings for label and description keyed by language code';
COMMENT ON COLUMN style_options.created_at IS 'Timestamp when the option was created';
COMMENT ON COLUMN style_options.updated_at IS 'Timestamp when the option was last updated';

-- User progress table
COMMENT ON TABLE user_progress IS 'Tracks user progress through the headshot generation workflow';
COMMENT ON COLUMN user_progress.id IS 'Unique identifier for the progress entry';
COMMENT ON COLUMN user_progress.user_id IS 'Reference to the user';
COMMENT ON COLUMN user_progress.current_stage IS 'Current stage in the workflow';
COMMENT ON COLUMN user_progress.completed_stages IS 'Array of completed workflow stages';
COMMENT ON COLUMN user_progress.stage_data IS 'JSON data specific to the current stage';
COMMENT ON COLUMN user_progress.last_active_at IS 'Timestamp of user''s last activity';
COMMENT ON COLUMN user_progress.created_at IS 'Timestamp when the progress tracking started';
COMMENT ON COLUMN user_progress.updated_at IS 'Timestamp when the progress was last updated';

-- Completed user journeys table
COMMENT ON TABLE completed_user_journeys IS 'Archives completed headshot generation workflows';
COMMENT ON COLUMN completed_user_journeys.id IS 'Unique identifier for the completed journey';
COMMENT ON COLUMN completed_user_journeys.user_id IS 'Reference to the user who completed the journey';
COMMENT ON COLUMN completed_user_journeys.journey_data IS 'JSON data containing the complete journey details';
COMMENT ON COLUMN completed_user_journeys.completed_at IS 'Timestamp when the journey was completed';
COMMENT ON COLUMN completed_user_journeys.created_at IS 'Timestamp when the journey record was created';
COMMENT ON COLUMN completed_user_journeys.updated_at IS 'Timestamp when the journey record was last updated';

-- Orders table
COMMENT ON TABLE orders IS 'Stores headshot orders and their payment/processing status';
COMMENT ON COLUMN orders.id IS 'Unique identifier for the order';
COMMENT ON COLUMN orders.user_id IS 'Reference to the user who created the order';
COMMENT ON COLUMN orders.status IS 'Current status of the order (draft, pending_payment, paid, processing, completed, cancelled)';
COMMENT ON COLUMN orders.amount IS 'Total amount for the order in smallest currency unit (e.g., cents)';
COMMENT ON COLUMN orders.currency IS 'Three-letter currency code (e.g., USD)';
COMMENT ON COLUMN orders.payment_intent_id IS 'Stripe payment intent ID for tracking payment status';
COMMENT ON COLUMN orders.payment_status IS 'Current status of the payment (pending, succeeded, failed)';
COMMENT ON COLUMN orders.metadata IS 'Additional order metadata stored as JSON';
COMMENT ON COLUMN orders.created_at IS 'Timestamp when the order was created';
COMMENT ON COLUMN orders.updated_at IS 'Timestamp when the order was last updated';
COMMENT ON COLUMN orders.idempotency_key IS 'Stripe idempotency key used for the most recent payment attempt';
COMMENT ON COLUMN orders.checkout_session_id IS 'Stripe checkout session ID for checkout-based payments';

-- Images table
COMMENT ON TABLE images IS 'Stores user-uploaded images and their metadata';
COMMENT ON COLUMN images.id IS 'Unique identifier for the image';
COMMENT ON COLUMN images.user_id IS 'Reference to the user who owns the image';
COMMENT ON COLUMN images.url IS 'Public URL where the image can be accessed';
COMMENT ON COLUMN images.created_at IS 'Timestamp when the image was uploaded';
COMMENT ON COLUMN images.file_name IS 'Original filename of the uploaded image';
COMMENT ON COLUMN images.file_size IS 'Size of the image file in bytes';
COMMENT ON COLUMN images.mime_type IS 'MIME type of the image (e.g., image/jpeg)';
COMMENT ON COLUMN images.dimensions IS 'Image dimensions stored as JSON {width: number, height: number}';
COMMENT ON COLUMN images.order_id IS 'Reference to the order this image belongs to'; 

-- Create function to generate unique style ID
CREATE OR REPLACE FUNCTION generate_style_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate a style ID in format: style_<timestamp>_<random>
  NEW.id := 'style_' || 
            TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS') || 
            '_' || 
            SUBSTR(MD5(RANDOM()::TEXT), 1, 6);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for styles table
CREATE TRIGGER set_style_id
  BEFORE INSERT ON styles
  FOR EACH ROW
  EXECUTE FUNCTION generate_style_id();

-- Add comment for the trigger
COMMENT ON FUNCTION generate_style_id IS 'Automatically generates a unique style ID for new styles'; 