

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";








ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."array_distinct"("arr" "text"[]) RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN ARRAY(SELECT DISTINCT unnest(arr));
END;
$$;


ALTER FUNCTION "public"."array_distinct"("arr" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."array_distinct"("arr" "anyarray") RETURNS "anyarray"
    LANGUAGE "plpgsql" IMMUTABLE PARALLEL SAFE
    AS $$
BEGIN
    RETURN (
        WITH flow_order AS (
            SELECT stage, ordering
            FROM (VALUES
                ('shoot', 1),
                ('payment', 2),
                ('upload', 3),
                ('review', 4),
                ('albums', 5)
            ) AS t(stage, ordering)
        )
        SELECT array_agg(DISTINCT elem ORDER BY 
            COALESCE((SELECT ordering FROM flow_order WHERE stage = elem::text), 999)
        )
        FROM unnest(arr) AS elem
        WHERE elem IS NOT NULL
    );
END;
$$;


ALTER FUNCTION "public"."array_distinct"("arr" "anyarray") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."force_cleanup_upload_session"("session_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- First delete chunks (explicit deletion before session)
  DELETE FROM public.upload_chunks WHERE upload_chunks.session_id = force_cleanup_upload_session.session_id;
  
  -- Then delete the session
  DELETE FROM public.upload_sessions WHERE id = force_cleanup_upload_session.session_id;
  
  -- Log the cleanup
  RAISE NOTICE 'Force cleaned up upload session: %', session_id;
END;
$$;


ALTER FUNCTION "public"."force_cleanup_upload_session"("session_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."force_cleanup_upload_session"("session_id" "uuid") IS 'Force cleanup of upload session and all related chunks when normal cleanup fails';



CREATE OR REPLACE FUNCTION "public"."generate_style_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Generate a style ID in format: style_<timestamp>_<random>
  NEW.id := 'style_' || 
            TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS') || 
            '_' || 
            SUBSTR(MD5(RANDOM()::TEXT), 1, 6);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_style_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_style_id"() IS 'Automatically generates a unique style ID for new styles';



CREATE OR REPLACE FUNCTION "public"."get_language_preference"() RETURNS character varying
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    lang VARCHAR;
BEGIN
    SELECT preferred_language INTO lang
    FROM public.user_language_preferences
    WHERE user_id = auth.uid();
    
    -- Return NULL if no preference is set, allowing i18next to use its default
    RETURN lang;
END;
$$;


ALTER FUNCTION "public"."get_language_preference"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_image_count"("face_model_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.face_models 
  SET 
    image_count = COALESCE(image_count, 0) + 1,
    updated_at = NOW()
  WHERE id = face_model_id;
END;
$$;


ALTER FUNCTION "public"."increment_image_count"("face_model_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_language_preference"("new_language" character varying) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO public.user_language_preferences (user_id, preferred_language)
    VALUES (auth.uid(), new_language)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        preferred_language = EXCLUDED.preferred_language,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."update_language_preference"("new_language" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."face_models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "thumbnail_url" "text",
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "image_count" integer DEFAULT 0,
    CONSTRAINT "chk_face_models_image_count_positive" CHECK (("image_count" >= 0)),
    CONSTRAINT "face_models_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'training'::"text", 'ready'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."face_models" OWNER TO "postgres";


COMMENT ON TABLE "public"."face_models" IS 'Stores face model data for AI training and inference';



COMMENT ON COLUMN "public"."face_models"."thumbnail_url" IS 'URL to representative thumbnail image';



COMMENT ON COLUMN "public"."face_models"."status" IS 'Current status: queued, training, ready, failed';



CREATE TABLE IF NOT EXISTS "public"."generated_images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "style_id" "text" NOT NULL,
    "upload_id" "uuid",
    "storage_path" "text" NOT NULL,
    "status" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "generated_images_status_check" CHECK (("status" = ANY (ARRAY['processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."generated_images" OWNER TO "postgres";


COMMENT ON TABLE "public"."generated_images" IS 'Stores the generated images issued from styles and inference_jobs';



CREATE TABLE IF NOT EXISTS "public"."images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "file_name" "text",
    "file_size" bigint,
    "mime_type" "text",
    "dimensions" "jsonb",
    "quality_score" double precision DEFAULT 0,
    "face_model_id" "uuid"
);


ALTER TABLE "public"."images" OWNER TO "postgres";


COMMENT ON TABLE "public"."images" IS 'Stores user-uploaded images and their metadata';



COMMENT ON COLUMN "public"."images"."id" IS 'Unique identifier for the image';



COMMENT ON COLUMN "public"."images"."user_id" IS 'Reference to the user who owns the image';



COMMENT ON COLUMN "public"."images"."url" IS 'Public URL where the image can be accessed';



COMMENT ON COLUMN "public"."images"."created_at" IS 'Timestamp when the image was uploaded';



COMMENT ON COLUMN "public"."images"."file_name" IS 'Original filename of the uploaded image';



COMMENT ON COLUMN "public"."images"."file_size" IS 'Size of the image file in bytes';



COMMENT ON COLUMN "public"."images"."mime_type" IS 'MIME type of the image (e.g., image/jpeg)';



COMMENT ON COLUMN "public"."images"."dimensions" IS 'Image dimensions stored as JSON {width: number, height: number}';



COMMENT ON COLUMN "public"."images"."face_model_id" IS 'Links image to a face model for training purposes';



CREATE TABLE IF NOT EXISTS "public"."inference_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "face_model_id" "uuid" NOT NULL,
    "style_id" "text",
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "inference_jobs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'running'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."inference_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."inference_jobs" IS 'Tracks AI inference jobs for image generation';



COMMENT ON COLUMN "public"."inference_jobs"."style_id" IS 'Optional reference to style configuration';



COMMENT ON COLUMN "public"."inference_jobs"."error_message" IS 'Detailed error message if job failed';



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "status" "text" NOT NULL,
    "amount" integer,
    "currency" "text",
    "payment_intent_id" "text",
    "payment_status" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "idempotency_key" "text",
    "checkout_session_id" "text"
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON TABLE "public"."orders" IS 'Stores headshot orders and their payment/processing status';



COMMENT ON COLUMN "public"."orders"."id" IS 'Unique identifier for the order';



COMMENT ON COLUMN "public"."orders"."user_id" IS 'Reference to the user who created the order';



COMMENT ON COLUMN "public"."orders"."status" IS 'Current status of the order (draft, pending_payment, paid, processing, completed, cancelled)';



COMMENT ON COLUMN "public"."orders"."amount" IS 'Total amount for the order in smallest currency unit (e.g., cents)';



COMMENT ON COLUMN "public"."orders"."currency" IS 'Three-letter currency code (e.g., USD)';



COMMENT ON COLUMN "public"."orders"."payment_intent_id" IS 'Stripe payment intent ID for tracking payment status';



COMMENT ON COLUMN "public"."orders"."payment_status" IS 'Current status of the payment (pending, succeeded, failed)';



COMMENT ON COLUMN "public"."orders"."metadata" IS 'Additional order metadata stored as JSON';



COMMENT ON COLUMN "public"."orders"."created_at" IS 'Timestamp when the order was created';



COMMENT ON COLUMN "public"."orders"."updated_at" IS 'Timestamp when the order was last updated';



COMMENT ON COLUMN "public"."orders"."idempotency_key" IS 'Stripe idempotency key used for the most recent payment attempt';



COMMENT ON COLUMN "public"."orders"."checkout_session_id" IS 'Stripe checkout session ID for checkout-based payments';



CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "expires_at" timestamp with time zone,
    "last_accessed_at" timestamp with time zone
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."sessions" IS 'Stores user session information for authentication';



COMMENT ON COLUMN "public"."sessions"."id" IS 'Unique identifier for the session';



COMMENT ON COLUMN "public"."sessions"."user_id" IS 'Reference to the user who owns this session';



COMMENT ON COLUMN "public"."sessions"."created_at" IS 'Timestamp when the session was created';



COMMENT ON COLUMN "public"."sessions"."updated_at" IS 'Timestamp when the session was last updated';



COMMENT ON COLUMN "public"."sessions"."expires_at" IS 'Timestamp when the session expires';



COMMENT ON COLUMN "public"."sessions"."last_accessed_at" IS 'Timestamp when the session was last accessed';



CREATE TABLE IF NOT EXISTS "public"."style_configs" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "tagline" "text",
    "description" "text",
    "preview_images" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "available_genders" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "available_backgrounds" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "available_clothing" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "available_clothing_colors" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "translations" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."style_configs" OWNER TO "postgres";


COMMENT ON TABLE "public"."style_configs" IS 'Stores predefined style configuration templates';



COMMENT ON COLUMN "public"."style_configs"."id" IS 'Unique identifier for the style config';



COMMENT ON COLUMN "public"."style_configs"."name" IS 'Name of the style configuration';



COMMENT ON COLUMN "public"."style_configs"."tagline" IS 'Short description or tagline for the style';



COMMENT ON COLUMN "public"."style_configs"."description" IS 'Detailed description of the style';



COMMENT ON COLUMN "public"."style_configs"."preview_images" IS 'JSON array of preview image URLs';



COMMENT ON COLUMN "public"."style_configs"."available_genders" IS 'Array of supported gender options';



COMMENT ON COLUMN "public"."style_configs"."available_backgrounds" IS 'Array of available background options';



COMMENT ON COLUMN "public"."style_configs"."available_clothing" IS 'Array of available clothing options';



COMMENT ON COLUMN "public"."style_configs"."available_clothing_colors" IS 'Array of available clothing color options';



COMMENT ON COLUMN "public"."style_configs"."translations" IS 'JSON object containing localized strings for name, tagline, and description keyed by language code';



COMMENT ON COLUMN "public"."style_configs"."created_at" IS 'Timestamp when the config was created';



COMMENT ON COLUMN "public"."style_configs"."updated_at" IS 'Timestamp when the config was last updated';



CREATE TABLE IF NOT EXISTS "public"."style_options" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "options" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "translations" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."style_options" OWNER TO "postgres";


COMMENT ON TABLE "public"."style_options" IS 'Stores available options for different style categories';



COMMENT ON COLUMN "public"."style_options"."id" IS 'Unique identifier for the style option';



COMMENT ON COLUMN "public"."style_options"."category" IS 'Category of the style option (e.g., background, clothing)';



COMMENT ON COLUMN "public"."style_options"."label" IS 'Display label for the option';



COMMENT ON COLUMN "public"."style_options"."description" IS 'Detailed description of the option';



COMMENT ON COLUMN "public"."style_options"."options" IS 'JSON array of specific options within this category';



COMMENT ON COLUMN "public"."style_options"."translations" IS 'JSON object containing localized strings for label and description keyed by language code';



COMMENT ON COLUMN "public"."style_options"."created_at" IS 'Timestamp when the option was created';



COMMENT ON COLUMN "public"."style_options"."updated_at" IS 'Timestamp when the option was last updated';



CREATE TABLE IF NOT EXISTS "public"."styles" (
    "id" "text" NOT NULL,
    "user_id" "uuid",
    "order_id" "uuid",
    "name" "text" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "prompt" "text"
);


ALTER TABLE "public"."styles" OWNER TO "postgres";


COMMENT ON TABLE "public"."styles" IS 'Stores user-created headshot style configurations';



COMMENT ON COLUMN "public"."styles"."id" IS 'Unique identifier for the style';



COMMENT ON COLUMN "public"."styles"."user_id" IS 'Reference to the user who created the style';



COMMENT ON COLUMN "public"."styles"."order_id" IS 'Reference to the order this style is associated with';



COMMENT ON COLUMN "public"."styles"."name" IS 'Name of the style';



COMMENT ON COLUMN "public"."styles"."settings" IS 'JSON configuration for the style settings';



COMMENT ON COLUMN "public"."styles"."status" IS 'Current status of the style (draft, active, etc.)';



COMMENT ON COLUMN "public"."styles"."created_at" IS 'Timestamp when the style was created';



COMMENT ON COLUMN "public"."styles"."updated_at" IS 'Timestamp when the style was last updated';



COMMENT ON COLUMN "public"."styles"."prompt" IS 'AI prompt text used for image generation';



CREATE TABLE IF NOT EXISTS "public"."training_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "face_model_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "modal_job_id" "text",
    "error_message" "text",
    CONSTRAINT "training_jobs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'running'::"text", 'success'::"text", 'failed'::"text"])))
);

ALTER TABLE ONLY "public"."training_jobs" REPLICA IDENTITY FULL;


ALTER TABLE "public"."training_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."training_jobs" IS 'Tracks AI model training jobs and their progress';



COMMENT ON COLUMN "public"."training_jobs"."status" IS 'Current status: queued, running, success, failed';



COMMENT ON COLUMN "public"."training_jobs"."modal_job_id" IS 'External Modal job ID for tracking';



COMMENT ON COLUMN "public"."training_jobs"."error_message" IS 'Detailed error message if training failed';



CREATE TABLE IF NOT EXISTS "public"."upload_chunks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "chunk_index" integer NOT NULL,
    "chunk_size" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "upload_chunks_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'uploaded'::"text"])))
);


ALTER TABLE "public"."upload_chunks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."upload_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "file_type" "text" NOT NULL,
    "total_chunks" integer NOT NULL,
    "completed_chunks" integer DEFAULT 0,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "final_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "quality_score" integer,
    CONSTRAINT "upload_sessions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."upload_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "user_id" "uuid" NOT NULL,
    "preferred_language" character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_settings" IS 'Stores the setting preferences of users';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Stores user profile information and authentication details';



COMMENT ON COLUMN "public"."users"."id" IS 'Primary key, references auth.users';



COMMENT ON COLUMN "public"."users"."email" IS 'User''s email address';



COMMENT ON COLUMN "public"."users"."full_name" IS 'User''s full name';



COMMENT ON COLUMN "public"."users"."avatar_url" IS 'URL to user''s profile picture';



COMMENT ON COLUMN "public"."users"."created_at" IS 'Timestamp when the user profile was created';



COMMENT ON COLUMN "public"."users"."updated_at" IS 'Timestamp when the user profile was last updated';



CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" bigint NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."waitlist" OWNER TO "postgres";


COMMENT ON TABLE "public"."waitlist" IS 'Store emails coming from the landing page waiting list';



ALTER TABLE "public"."waitlist" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."waitlist_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."face_models"
    ADD CONSTRAINT "face_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generated_images"
    ADD CONSTRAINT "generated_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inference_jobs"
    ADD CONSTRAINT "inference_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."style_configs"
    ADD CONSTRAINT "style_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."style_options"
    ADD CONSTRAINT "style_options_category_unique" UNIQUE ("category");



COMMENT ON CONSTRAINT "style_options_category_unique" ON "public"."style_options" IS 'Ensures each category (background, clothing, clothingColor) only appears once in the table to match API assumptions';



ALTER TABLE ONLY "public"."style_options"
    ADD CONSTRAINT "style_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."styles"
    ADD CONSTRAINT "styles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_jobs"
    ADD CONSTRAINT "training_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."upload_chunks"
    ADD CONSTRAINT "upload_chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."upload_chunks"
    ADD CONSTRAINT "upload_chunks_session_id_chunk_index_key" UNIQUE ("session_id", "chunk_index");



ALTER TABLE ONLY "public"."upload_sessions"
    ADD CONSTRAINT "upload_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_language_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_face_models_created_at" ON "public"."face_models" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_face_models_image_count" ON "public"."face_models" USING "btree" ("image_count");



CREATE INDEX "idx_face_models_status" ON "public"."face_models" USING "btree" ("status");



CREATE INDEX "idx_face_models_user_id" ON "public"."face_models" USING "btree" ("user_id");



CREATE INDEX "idx_generated_images_status" ON "public"."generated_images" USING "btree" ("status");



CREATE INDEX "idx_generated_images_style_id" ON "public"."generated_images" USING "btree" ("style_id");



CREATE INDEX "idx_generated_images_upload_id" ON "public"."generated_images" USING "btree" ("upload_id");



CREATE INDEX "idx_images_face_model_id" ON "public"."images" USING "btree" ("face_model_id");



CREATE INDEX "idx_inference_jobs_created_at" ON "public"."inference_jobs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_inference_jobs_face_model_id" ON "public"."inference_jobs" USING "btree" ("face_model_id");



CREATE INDEX "idx_inference_jobs_status" ON "public"."inference_jobs" USING "btree" ("status");



CREATE INDEX "idx_inference_jobs_style_id" ON "public"."inference_jobs" USING "btree" ("style_id");



CREATE INDEX "idx_inference_jobs_user_id" ON "public"."inference_jobs" USING "btree" ("user_id");



CREATE INDEX "idx_training_jobs_created_at" ON "public"."training_jobs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_training_jobs_face_model_id" ON "public"."training_jobs" USING "btree" ("face_model_id");



CREATE INDEX "idx_training_jobs_status" ON "public"."training_jobs" USING "btree" ("status");



CREATE INDEX "idx_training_jobs_user_id" ON "public"."training_jobs" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "set_style_id" BEFORE INSERT ON "public"."styles" FOR EACH ROW EXECUTE FUNCTION "public"."generate_style_id"();



CREATE OR REPLACE TRIGGER "update_face_models_updated_at" BEFORE UPDATE ON "public"."face_models" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_images_updated_at" BEFORE UPDATE ON "public"."images" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_inference_jobs_updated_at" BEFORE UPDATE ON "public"."inference_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sessions_updated_at" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_style_configs_updated_at" BEFORE UPDATE ON "public"."style_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_style_options_updated_at" BEFORE UPDATE ON "public"."style_options" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_styles_updated_at" BEFORE UPDATE ON "public"."styles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_training_jobs_updated_at" BEFORE UPDATE ON "public"."training_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."face_models"
    ADD CONSTRAINT "face_models_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "fk_images_face_model_id" FOREIGN KEY ("face_model_id") REFERENCES "public"."face_models"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."generated_images"
    ADD CONSTRAINT "generated_images_style_id_fkey" FOREIGN KEY ("style_id") REFERENCES "public"."styles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."generated_images"
    ADD CONSTRAINT "generated_images_style_id_fkey1" FOREIGN KEY ("style_id") REFERENCES "public"."styles"("id");



ALTER TABLE ONLY "public"."generated_images"
    ADD CONSTRAINT "generated_images_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "public"."images"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inference_jobs"
    ADD CONSTRAINT "inference_jobs_face_model_id_fkey" FOREIGN KEY ("face_model_id") REFERENCES "public"."face_models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inference_jobs"
    ADD CONSTRAINT "inference_jobs_style_id_fkey" FOREIGN KEY ("style_id") REFERENCES "public"."styles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inference_jobs"
    ADD CONSTRAINT "inference_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."styles"
    ADD CONSTRAINT "styles_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



COMMENT ON CONSTRAINT "styles_order_id_fkey" ON "public"."styles" IS 'Links styles to their associated order, cascade deletes styles when order is deleted';



ALTER TABLE ONLY "public"."styles"
    ADD CONSTRAINT "styles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_jobs"
    ADD CONSTRAINT "training_jobs_face_model_id_fkey" FOREIGN KEY ("face_model_id") REFERENCES "public"."face_models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_jobs"
    ADD CONSTRAINT "training_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."upload_chunks"
    ADD CONSTRAINT "upload_chunks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."upload_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."upload_sessions"
    ADD CONSTRAINT "upload_sessions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."upload_sessions"
    ADD CONSTRAINT "upload_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_language_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow insert during signup" ON "public"."users" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Allow public insert" ON "public"."waitlist" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read access to style_configs" ON "public"."style_configs" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow public read access to style_options" ON "public"."style_options" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable realtime for users own styles" ON "public"."styles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Public read access" ON "public"."style_configs" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public read access" ON "public"."style_options" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Users can create generated images" ON "public"."generated_images" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."styles" "s"
  WHERE (("s"."id" = "generated_images"."style_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create their own face models" ON "public"."face_models" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own inference jobs" ON "public"."inference_jobs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own training jobs" ON "public"."training_jobs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own face models" ON "public"."face_models" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own inference jobs" ON "public"."inference_jobs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own sessions" ON "public"."sessions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own training jobs" ON "public"."training_jobs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert chunks for their upload sessions" ON "public"."upload_chunks" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."upload_sessions"
  WHERE (("upload_sessions"."id" = "upload_chunks"."session_id") AND ("upload_sessions"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own upload sessions" ON "public"."upload_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own images" ON "public"."images" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own orders" ON "public"."orders" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own sessions" ON "public"."sessions" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own settings" ON "public"."user_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own styles" ON "public"."styles" TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = ( SELECT "orders"."user_id"
   FROM "public"."orders"
  WHERE ("orders"."id" = "styles"."order_id"))))) WITH CHECK ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = ( SELECT "orders"."user_id"
   FROM "public"."orders"
  WHERE ("orders"."id" = "styles"."order_id")))));



CREATE POLICY "Users can read their own generated images" ON "public"."generated_images" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."styles" "s"
  WHERE (("s"."id" = "generated_images"."style_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can read their own settings" ON "public"."user_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update chunks for their upload sessions" ON "public"."upload_chunks" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."upload_sessions"
  WHERE (("upload_sessions"."id" = "upload_chunks"."session_id") AND ("upload_sessions"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own face models" ON "public"."face_models" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own generated images" ON "public"."generated_images" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."styles" "s"
  WHERE (("s"."id" = "generated_images"."style_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own inference jobs" ON "public"."inference_jobs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own settings" ON "public"."user_settings" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own training jobs" ON "public"."training_jobs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own upload sessions" ON "public"."upload_sessions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view chunks for their upload sessions" ON "public"."upload_chunks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."upload_sessions"
  WHERE (("upload_sessions"."id" = "upload_chunks"."session_id") AND ("upload_sessions"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own face models" ON "public"."face_models" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own inference jobs" ON "public"."inference_jobs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own sessions" ON "public"."sessions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own training jobs" ON "public"."training_jobs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own upload sessions" ON "public"."upload_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."face_models" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generated_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inference_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."style_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."style_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."styles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."upload_chunks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."upload_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";




















































































































































































GRANT ALL ON FUNCTION "public"."force_cleanup_upload_session"("session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."force_cleanup_upload_session"("session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_language_preference"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_image_count"("face_model_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."update_language_preference"("new_language" character varying) TO "authenticated";



























GRANT SELECT ON TABLE "public"."face_models" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."face_models" TO "authenticated";
GRANT ALL ON TABLE "public"."face_models" TO "service_role";



GRANT SELECT ON TABLE "public"."generated_images" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."generated_images" TO "authenticated";



GRANT ALL ON TABLE "public"."images" TO "authenticated";



GRANT SELECT ON TABLE "public"."inference_jobs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."inference_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."inference_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "authenticated";



GRANT ALL ON TABLE "public"."sessions" TO "authenticated";



GRANT ALL ON TABLE "public"."style_configs" TO "authenticated";
GRANT SELECT ON TABLE "public"."style_configs" TO "anon";



GRANT ALL ON TABLE "public"."style_options" TO "authenticated";
GRANT SELECT ON TABLE "public"."style_options" TO "anon";



GRANT ALL ON TABLE "public"."styles" TO "authenticated";



GRANT SELECT ON TABLE "public"."training_jobs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."training_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."training_jobs" TO "service_role";



GRANT SELECT ON TABLE "public"."upload_chunks" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."upload_chunks" TO "authenticated";



GRANT SELECT ON TABLE "public"."upload_sessions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."upload_sessions" TO "authenticated";



GRANT SELECT ON TABLE "public"."user_settings" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_settings" TO "authenticated";



GRANT ALL ON TABLE "public"."users" TO "authenticated";



GRANT SELECT ON TABLE "public"."waitlist" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."waitlist" TO "authenticated";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES  TO "authenticated";



























RESET ALL;
