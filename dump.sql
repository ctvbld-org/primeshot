

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






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."flow_stage" AS ENUM (
    'shoot',
    'payment',
    'upload',
    'review',
    'albums'
);


ALTER TYPE "public"."flow_stage" OWNER TO "postgres";


COMMENT ON TYPE "public"."flow_stage" IS 'Represents the different stages in the headshot generation workflow';



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
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


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
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."completed_user_journeys" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "journey_data" "jsonb" NOT NULL,
    "completed_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."completed_user_journeys" OWNER TO "postgres";


COMMENT ON TABLE "public"."completed_user_journeys" IS 'Archives completed headshot generation workflows';



COMMENT ON COLUMN "public"."completed_user_journeys"."id" IS 'Unique identifier for the completed journey';



COMMENT ON COLUMN "public"."completed_user_journeys"."user_id" IS 'Reference to the user who completed the journey';



COMMENT ON COLUMN "public"."completed_user_journeys"."journey_data" IS 'JSON data containing the complete journey details';



COMMENT ON COLUMN "public"."completed_user_journeys"."completed_at" IS 'Timestamp when the journey was completed';



COMMENT ON COLUMN "public"."completed_user_journeys"."created_at" IS 'Timestamp when the journey record was created';



COMMENT ON COLUMN "public"."completed_user_journeys"."updated_at" IS 'Timestamp when the journey record was last updated';



CREATE TABLE IF NOT EXISTS "public"."images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "file_name" "text",
    "file_size" bigint,
    "mime_type" "text",
    "dimensions" "jsonb",
    "order_id" "uuid"
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



COMMENT ON COLUMN "public"."images"."order_id" IS 'Reference to the order this image belongs to';



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
    "expires_at" timestamp with time zone NOT NULL,
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
    "name" "text" NOT NULL,
    "settings" "jsonb" NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "order_id" "uuid"
);


ALTER TABLE "public"."styles" OWNER TO "postgres";


COMMENT ON TABLE "public"."styles" IS 'Stores user-created headshot style configurations';



COMMENT ON COLUMN "public"."styles"."id" IS 'Unique identifier for the style';



COMMENT ON COLUMN "public"."styles"."user_id" IS 'Reference to the user who created the style';



COMMENT ON COLUMN "public"."styles"."name" IS 'Name of the style';



COMMENT ON COLUMN "public"."styles"."settings" IS 'JSON configuration for the style settings';



COMMENT ON COLUMN "public"."styles"."status" IS 'Current status of the style (draft, active, etc.)';



COMMENT ON COLUMN "public"."styles"."created_at" IS 'Timestamp when the style was created';



COMMENT ON COLUMN "public"."styles"."updated_at" IS 'Timestamp when the style was last updated';



CREATE TABLE IF NOT EXISTS "public"."user_language_preferences" (
    "user_id" "uuid" NOT NULL,
    "preferred_language" character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_language_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "current_stage" "public"."flow_stage" NOT NULL,
    "completed_stages" "public"."flow_stage"[] DEFAULT '{}'::"public"."flow_stage"[] NOT NULL,
    "stage_data" "jsonb",
    "last_active_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."user_progress" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_progress" IS 'Tracks user progress through the headshot generation workflow';



COMMENT ON COLUMN "public"."user_progress"."id" IS 'Unique identifier for the progress entry';



COMMENT ON COLUMN "public"."user_progress"."user_id" IS 'Reference to the user';



COMMENT ON COLUMN "public"."user_progress"."current_stage" IS 'Current stage in the workflow';



COMMENT ON COLUMN "public"."user_progress"."completed_stages" IS 'Array of completed workflow stages';



COMMENT ON COLUMN "public"."user_progress"."stage_data" IS 'JSON data specific to the current stage';



COMMENT ON COLUMN "public"."user_progress"."last_active_at" IS 'Timestamp of user''s last activity';



COMMENT ON COLUMN "public"."user_progress"."created_at" IS 'Timestamp when the progress tracking started';



COMMENT ON COLUMN "public"."user_progress"."updated_at" IS 'Timestamp when the progress was last updated';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "gender" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Stores user profile information and authentication details';



COMMENT ON COLUMN "public"."users"."id" IS 'Primary key, references auth.users';



COMMENT ON COLUMN "public"."users"."email" IS 'User''s email address';



COMMENT ON COLUMN "public"."users"."full_name" IS 'User''s full name';



COMMENT ON COLUMN "public"."users"."avatar_url" IS 'URL to user''s profile picture';



COMMENT ON COLUMN "public"."users"."gender" IS 'User''s gender preference for headshot generation';



COMMENT ON COLUMN "public"."users"."created_at" IS 'Timestamp when the user profile was created';



COMMENT ON COLUMN "public"."users"."updated_at" IS 'Timestamp when the user profile was last updated';



ALTER TABLE ONLY "public"."completed_user_journeys"
    ADD CONSTRAINT "completed_user_journeys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."user_language_preferences"
    ADD CONSTRAINT "user_language_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "set_style_id" BEFORE INSERT ON "public"."styles" FOR EACH ROW EXECUTE FUNCTION "public"."generate_style_id"();



CREATE OR REPLACE TRIGGER "update_completed_user_journeys_updated_at" BEFORE UPDATE ON "public"."completed_user_journeys" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_images_updated_at" BEFORE UPDATE ON "public"."images" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sessions_updated_at" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_style_configs_updated_at" BEFORE UPDATE ON "public"."style_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_style_options_updated_at" BEFORE UPDATE ON "public"."style_options" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_styles_updated_at" BEFORE UPDATE ON "public"."styles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_progress_updated_at" BEFORE UPDATE ON "public"."user_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."completed_user_journeys"
    ADD CONSTRAINT "completed_user_journeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."styles"
    ADD CONSTRAINT "styles_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



COMMENT ON CONSTRAINT "styles_order_id_fkey" ON "public"."styles" IS 'Links styles to their associated order, cascade deletes styles when order is deleted';



ALTER TABLE ONLY "public"."styles"
    ADD CONSTRAINT "styles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_language_preferences"
    ADD CONSTRAINT "user_language_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow insert during signup" ON "public"."users" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Allow public read access to style_configs" ON "public"."style_configs" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow public read access to style_options" ON "public"."style_options" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable realtime for users own styles" ON "public"."styles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own sessions" ON "public"."sessions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own language preference" ON "public"."user_language_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own images" ON "public"."images" TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own orders" ON "public"."orders" TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own progress" ON "public"."user_progress" TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own styles" ON "public"."styles" TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own language preference" ON "public"."user_language_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own language preference" ON "public"."user_language_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own completed journeys" ON "public"."completed_user_journeys" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own sessions" ON "public"."sessions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."completed_user_journeys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."style_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."style_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."styles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_language_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."styles";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."generate_style_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_style_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_style_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_language_preference"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_language_preference"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_language_preference"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_language_preference"("new_language" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."update_language_preference"("new_language" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_language_preference"("new_language" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



























GRANT ALL ON TABLE "public"."completed_user_journeys" TO "anon";
GRANT ALL ON TABLE "public"."completed_user_journeys" TO "authenticated";
GRANT ALL ON TABLE "public"."completed_user_journeys" TO "service_role";



GRANT ALL ON TABLE "public"."images" TO "anon";
GRANT ALL ON TABLE "public"."images" TO "authenticated";
GRANT ALL ON TABLE "public"."images" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."style_configs" TO "anon";
GRANT ALL ON TABLE "public"."style_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."style_configs" TO "service_role";



GRANT ALL ON TABLE "public"."style_options" TO "anon";
GRANT ALL ON TABLE "public"."style_options" TO "authenticated";
GRANT ALL ON TABLE "public"."style_options" TO "service_role";



GRANT ALL ON TABLE "public"."styles" TO "anon";
GRANT ALL ON TABLE "public"."styles" TO "authenticated";
GRANT ALL ON TABLE "public"."styles" TO "service_role";



GRANT ALL ON TABLE "public"."user_language_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_language_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_language_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_progress" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
