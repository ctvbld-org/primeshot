-- Create flow_stage enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.flow_stage AS ENUM ('shoot', 'payment', 'upload', 'review', 'albums');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE public.flow_stage IS 'Represents the different stages in the user flow for photo generation';

-- Create tables in dependency order
CREATE TABLE IF NOT EXISTS public.users (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    eye_color text,
    hair_color text,
    hair_length text,
    hair_style text,
    age text,
    body_type text,
    height text,
    weight text,
    ethnicity text,
    glasses boolean,
    gender text
);

CREATE TABLE IF NOT EXISTS public.sessions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    last_accessed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    status text NOT NULL,
    amount integer,
    currency text,
    payment_intent_id text,
    payment_status text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    idempotency_key text,
    checkout_session_id text
);

CREATE TABLE IF NOT EXISTS public.styles (
    id text PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    settings jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL,
    prompt text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.style_configs (
    id text PRIMARY KEY,
    name text NOT NULL,
    tagline text,
    description text,
    preview_images jsonb DEFAULT '[]'::jsonb NOT NULL,
    available_genders text[] DEFAULT '{}'::text[] NOT NULL,
    available_backgrounds text[] DEFAULT '{}'::text[] NOT NULL,
    available_clothing text[] DEFAULT '{}'::text[] NOT NULL,
    available_clothing_colors text[] DEFAULT '{}'::text[] NOT NULL,
    translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.style_options (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    category text NOT NULL UNIQUE,
    label text NOT NULL,
    description text,
    options jsonb DEFAULT '[]'::jsonb NOT NULL,
    translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.images (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    url text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    file_name text,
    file_size bigint,
    mime_type text,
    dimensions jsonb DEFAULT '{}'::jsonb,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    quality_score float8
);

CREATE TABLE IF NOT EXISTS public.user_progress (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    current_stage flow_stage NOT NULL,
    completed_stages flow_stage[] DEFAULT '{}'::flow_stage[] NOT NULL,
    stage_data jsonb DEFAULT '{}'::jsonb,
    last_active_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.completed_user_journeys (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    journey_data jsonb NOT NULL,
    completed_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_language_preferences (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    preferred_language character varying,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.generated_images (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    style_id text REFERENCES public.styles(id) ON DELETE CASCADE,
    status text NOT NULL,
    url text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create upload_sessions table
CREATE TABLE IF NOT EXISTS public.upload_sessions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    file_name text NOT NULL,
    file_size bigint NOT NULL,
    file_type text NOT NULL,
    total_chunks integer NOT NULL,
    completed_chunks integer DEFAULT 0,
    status text DEFAULT 'pending'::text NOT NULL,
    final_url text,
    quality_score integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create upload_chunks table
CREATE TABLE IF NOT EXISTS public.upload_chunks (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    session_id uuid REFERENCES public.upload_sessions(id) ON DELETE CASCADE NOT NULL,
    chunk_index integer NOT NULL,
    chunk_size integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Add unique constraint to prevent duplicate chunks
    UNIQUE(session_id, chunk_index)
);

-- Create functions
CREATE OR REPLACE FUNCTION public.generate_style_id()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Generate a style ID in format: style_<timestamp>_<random>
  NEW.id := 'style_' || 
            TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS') || 
            '_' || 
            SUBSTR(MD5(RANDOM()::TEXT), 1, 6);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_language_preference()
RETURNS character varying
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    lang VARCHAR;
BEGIN
    SELECT preferred_language INTO lang
    FROM public.user_language_preferences
    WHERE user_id = auth.uid();
    
    -- Return NULL if no preference is set, allowing i18next to use its default
    RETURN lang;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    _full_name TEXT;
    _avatar_url TEXT;
BEGIN
    -- Log the start of the function
    RAISE LOG 'handle_new_user: Starting for user ID: %, email: %', NEW.id, NEW.email;
    
    -- Extract metadata with proper null handling
    _full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NULLIF(CONCAT(
            COALESCE(NEW.raw_user_meta_data->>'given_name', ''),
            ' ',
            COALESCE(NEW.raw_user_meta_data->>'family_name', '')
        ), ' '),
        NEW.raw_user_meta_data->>'user_name'
    );
    
    _avatar_url := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
    );
    
    -- Log the extracted values
    RAISE LOG 'handle_new_user: Extracted full_name: %, avatar_url: %', _full_name, _avatar_url;
    
    -- Attempt the insert
    INSERT INTO public.users (
        id,
        email,
        full_name,
        avatar_url,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        _full_name,
        _avatar_url,
        TIMEZONE('utc', NOW()),
        TIMEZONE('utc', NOW())
    );
    
    RAISE LOG 'handle_new_user: Successfully created user in public.users';
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the detailed error
    RAISE LOG 'handle_new_user ERROR for user ID %: %, SQLSTATE: %, DETAIL: %, HINT: %',
        NEW.id,
        SQLERRM,
        SQLSTATE,
        COALESCE(SQLERRM, 'NO DETAIL'),
        COALESCE(SQLHINT, 'NO HINT');
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_language_preference(new_language character varying)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.user_language_preferences (user_id, preferred_language)
    VALUES (auth.uid(), new_language)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        preferred_language = EXCLUDED.preferred_language,
        updated_at = NOW();
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$function$;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS set_style_id ON public.styles;
CREATE TRIGGER set_style_id
  BEFORE INSERT ON public.styles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_style_id();

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_user_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_language_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_chunks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users"
ON public.users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own data"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own sessions"
ON public.sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.sessions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow public read access to style_configs"
ON public.style_configs FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Allow public read access to style_options"
ON public.style_options FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can manage their own styles"
ON public.styles FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own orders"
ON public.orders FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own images"
ON public.images FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress"
ON public.user_progress FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own completed journeys"
ON public.completed_user_journeys FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own language preferences"
ON public.user_language_preferences FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own generated images"
ON public.generated_images FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Add policies for upload_sessions
CREATE POLICY "Users can manage their own upload sessions"
ON public.upload_sessions FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Add policies for upload_chunks
CREATE POLICY "Users can manage chunks for their own upload sessions"
ON public.upload_chunks FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.upload_sessions
        WHERE id = upload_chunks.session_id
        AND user_id = auth.uid()
    )
);

-- Create updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_styles_updated_at ON public.styles;
CREATE TRIGGER update_styles_updated_at
  BEFORE UPDATE ON public.styles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_style_configs_updated_at ON public.style_configs;
CREATE TRIGGER update_style_configs_updated_at
  BEFORE UPDATE ON public.style_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_style_options_updated_at ON public.style_options;
CREATE TRIGGER update_style_options_updated_at
  BEFORE UPDATE ON public.style_options
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_images_updated_at ON public.images;
CREATE TRIGGER update_images_updated_at
  BEFORE UPDATE ON public.images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON public.user_progress;
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_completed_user_journeys_updated_at ON public.completed_user_journeys;
CREATE TRIGGER update_completed_user_journeys_updated_at
  BEFORE UPDATE ON public.completed_user_journeys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_generated_images_updated_at ON public.generated_images;
CREATE TRIGGER update_generated_images_updated_at
    BEFORE UPDATE ON public.generated_images
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS user_progress_updated_at ON public.user_progress;
CREATE TRIGGER user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add triggers for upload_sessions
DROP TRIGGER IF EXISTS update_upload_sessions_updated_at ON public.upload_sessions;
CREATE TRIGGER update_upload_sessions_updated_at
    BEFORE UPDATE ON public.upload_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add triggers for upload_chunks
DROP TRIGGER IF EXISTS update_upload_chunks_updated_at ON public.upload_chunks;
CREATE TRIGGER update_upload_chunks_updated_at
    BEFORE UPDATE ON public.upload_chunks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Add table and column comments
COMMENT ON TABLE public.users IS 'Stores user profile information and preferences';
COMMENT ON COLUMN public.users.eye_color IS 'User''s eye color for style matching';
COMMENT ON COLUMN public.users.hair_color IS 'User''s hair color for style matching';
COMMENT ON COLUMN public.users.hair_length IS 'User''s hair length for style matching';
COMMENT ON COLUMN public.users.hair_style IS 'User''s hair style for style matching';
COMMENT ON COLUMN public.users.age IS 'User''s age for age-appropriate style suggestions';
COMMENT ON COLUMN public.users.body_type IS 'User''s body type for style matching';
COMMENT ON COLUMN public.users.height IS 'User''s height in centimeters';
COMMENT ON COLUMN public.users.weight IS 'User''s weight in kilograms';
COMMENT ON COLUMN public.users.ethnicity IS 'User''s ethnicity for diverse style matching';
COMMENT ON COLUMN public.users.glasses IS 'Whether the user wears glasses';
COMMENT ON COLUMN public.users.gender IS 'User''s gender for style matching';

COMMENT ON TABLE public.sessions IS 'Stores user session information for authentication';
COMMENT ON COLUMN public.sessions.expires_at IS 'Timestamp when the session expires';
COMMENT ON COLUMN public.sessions.last_accessed_at IS 'Last time the session was used';

COMMENT ON TABLE public.styles IS 'Stores user-created style configurations';
COMMENT ON COLUMN public.styles.settings IS 'JSON configuration for the style including photography style, outfit, and background';
COMMENT ON COLUMN public.styles.status IS 'Current status of the style (draft, processing, completed, etc.)';
COMMENT ON COLUMN public.styles.prompt IS 'AI prompt text used for image generation';

COMMENT ON TABLE public.style_configs IS 'Predefined style configurations available to users';
COMMENT ON COLUMN public.style_configs.preview_images IS 'Sample images showing the style';
COMMENT ON COLUMN public.style_configs.available_genders IS 'List of genders this style is available for';
COMMENT ON COLUMN public.style_configs.available_backgrounds IS 'List of available background options';
COMMENT ON COLUMN public.style_configs.available_clothing IS 'List of available clothing options';
COMMENT ON COLUMN public.style_configs.translations IS 'Localized strings for the style configuration';

COMMENT ON TABLE public.style_options IS 'Available options for style customization';
COMMENT ON COLUMN public.style_options.category IS 'Category of the option (e.g., background, clothing)';
COMMENT ON COLUMN public.style_options.options IS 'JSON array of available options in this category';
COMMENT ON COLUMN public.style_options.translations IS 'Localized strings for the options';

COMMENT ON TABLE public.orders IS 'User orders for style generation';
COMMENT ON COLUMN public.orders.status IS 'Order status (pending, paid, processing, completed)';
COMMENT ON COLUMN public.orders.payment_intent_id IS 'Stripe payment intent ID';
COMMENT ON COLUMN public.orders.payment_status IS 'Status of the payment';
COMMENT ON COLUMN public.orders.metadata IS 'Additional order metadata';

COMMENT ON TABLE public.images IS 'User-uploaded reference images';
COMMENT ON COLUMN public.images.url IS 'Storage URL for the image';
COMMENT ON COLUMN public.images.dimensions IS 'Image dimensions in JSON format {width: number, height: number}';
COMMENT ON COLUMN public.images.quality_score IS 'AI-generated quality score for the image';

COMMENT ON TABLE public.user_progress IS 'Tracks user progress through the application flow';
COMMENT ON COLUMN public.user_progress.current_stage IS 'Current stage in the user flow';
COMMENT ON COLUMN public.user_progress.completed_stages IS 'Array of completed flow stages';
COMMENT ON COLUMN public.user_progress.stage_data IS 'Stage-specific progress data';

COMMENT ON TABLE public.completed_user_journeys IS 'Archive of completed user flows';
COMMENT ON COLUMN public.completed_user_journeys.journey_data IS 'Complete journey data including all stages';

COMMENT ON TABLE public.user_language_preferences IS 'User language preferences for localization';
COMMENT ON COLUMN public.user_language_preferences.preferred_language IS 'User''s preferred language code';

COMMENT ON TABLE public.generated_images IS 'AI-generated images from user styles';
COMMENT ON COLUMN public.generated_images.status IS 'Generation status (pending, processing, completed, failed)';
COMMENT ON COLUMN public.generated_images.url IS 'Storage URL for the generated image';
COMMENT ON COLUMN public.generated_images.metadata IS 'Generation metadata including prompts and settings';
COMMENT ON COLUMN public.generated_images.error_message IS 'Error message if generation failed';

-- Add comments for upload_sessions
COMMENT ON TABLE public.upload_sessions IS 'Tracks file upload sessions and their progress';
COMMENT ON COLUMN public.upload_sessions.file_name IS 'Original name of the uploaded file';
COMMENT ON COLUMN public.upload_sessions.file_size IS 'Total size of the file in bytes';
COMMENT ON COLUMN public.upload_sessions.file_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN public.upload_sessions.total_chunks IS 'Total number of chunks expected for this file';
COMMENT ON COLUMN public.upload_sessions.completed_chunks IS 'Number of chunks successfully uploaded';
COMMENT ON COLUMN public.upload_sessions.status IS 'Upload session status (pending, processing, completed, failed)';
COMMENT ON COLUMN public.upload_sessions.final_url IS 'URL of the final processed and stored file';
COMMENT ON COLUMN public.upload_sessions.quality_score IS 'Quality assessment score for the uploaded image';

-- Add comments for upload_chunks
COMMENT ON TABLE public.upload_chunks IS 'Individual chunks of uploaded files';
COMMENT ON COLUMN public.upload_chunks.chunk_index IS 'Zero-based index of the chunk in the complete file';
COMMENT ON COLUMN public.upload_chunks.chunk_size IS 'Size of this chunk in bytes';
COMMENT ON COLUMN public.upload_chunks.status IS 'Status of the chunk upload (pending, uploaded)'; 