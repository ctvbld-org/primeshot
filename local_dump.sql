--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

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

DROP EVENT TRIGGER IF EXISTS "pgrst_drop_watch";
DROP EVENT TRIGGER IF EXISTS "pgrst_ddl_watch";
DROP EVENT TRIGGER IF EXISTS "issue_pg_net_access";
DROP EVENT TRIGGER IF EXISTS "issue_pg_graphql_access";
DROP EVENT TRIGGER IF EXISTS "issue_pg_cron_access";
DROP EVENT TRIGGER IF EXISTS "issue_graphql_placeholder";
DROP PUBLICATION IF EXISTS "supabase_realtime_messages_publication";
DROP PUBLICATION IF EXISTS "supabase_realtime";
DROP POLICY IF EXISTS "Users can view their own sessions" ON "public"."sessions";
DROP POLICY IF EXISTS "Users can view their own profile" ON "public"."users";
DROP POLICY IF EXISTS "Users can view their own completed journeys" ON "public"."completed_user_journeys";
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."users";
DROP POLICY IF EXISTS "Users can update their own language preference" ON "public"."user_language_preferences";
DROP POLICY IF EXISTS "Users can read their own language preference" ON "public"."user_language_preferences";
DROP POLICY IF EXISTS "Users can manage their own styles" ON "public"."styles";
DROP POLICY IF EXISTS "Users can manage their own progress" ON "public"."user_progress";
DROP POLICY IF EXISTS "Users can manage their own orders" ON "public"."orders";
DROP POLICY IF EXISTS "Users can manage their own images" ON "public"."images";
DROP POLICY IF EXISTS "Users can insert their own language preference" ON "public"."user_language_preferences";
DROP POLICY IF EXISTS "Users can delete their own sessions" ON "public"."sessions";
DROP POLICY IF EXISTS "Enable realtime for users own styles" ON "public"."styles";
DROP POLICY IF EXISTS "Allow public read access to style_options" ON "public"."style_options";
DROP POLICY IF EXISTS "Allow public read access to style_configs" ON "public"."style_configs";
DROP POLICY IF EXISTS "Allow insert during signup" ON "public"."users";
ALTER TABLE IF EXISTS ONLY "storage"."s3_multipart_uploads_parts" DROP CONSTRAINT IF EXISTS "s3_multipart_uploads_parts_upload_id_fkey";
ALTER TABLE IF EXISTS ONLY "storage"."s3_multipart_uploads_parts" DROP CONSTRAINT IF EXISTS "s3_multipart_uploads_parts_bucket_id_fkey";
ALTER TABLE IF EXISTS ONLY "storage"."s3_multipart_uploads" DROP CONSTRAINT IF EXISTS "s3_multipart_uploads_bucket_id_fkey";
ALTER TABLE IF EXISTS ONLY "storage"."objects" DROP CONSTRAINT IF EXISTS "objects_bucketId_fkey";
ALTER TABLE IF EXISTS ONLY "public"."users" DROP CONSTRAINT IF EXISTS "users_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."user_progress" DROP CONSTRAINT IF EXISTS "user_progress_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."user_language_preferences" DROP CONSTRAINT IF EXISTS "user_language_preferences_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."styles" DROP CONSTRAINT IF EXISTS "styles_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."styles" DROP CONSTRAINT IF EXISTS "styles_order_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."sessions" DROP CONSTRAINT IF EXISTS "sessions_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."orders" DROP CONSTRAINT IF EXISTS "orders_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."images" DROP CONSTRAINT IF EXISTS "images_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."images" DROP CONSTRAINT IF EXISTS "images_order_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."completed_user_journeys" DROP CONSTRAINT IF EXISTS "completed_user_journeys_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."sso_domains" DROP CONSTRAINT IF EXISTS "sso_domains_sso_provider_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."sessions" DROP CONSTRAINT IF EXISTS "sessions_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."saml_relay_states" DROP CONSTRAINT IF EXISTS "saml_relay_states_sso_provider_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."saml_relay_states" DROP CONSTRAINT IF EXISTS "saml_relay_states_flow_state_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."saml_providers" DROP CONSTRAINT IF EXISTS "saml_providers_sso_provider_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."refresh_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_session_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."one_time_tokens" DROP CONSTRAINT IF EXISTS "one_time_tokens_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_factors" DROP CONSTRAINT IF EXISTS "mfa_factors_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_challenges" DROP CONSTRAINT IF EXISTS "mfa_challenges_auth_factor_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_amr_claims" DROP CONSTRAINT IF EXISTS "mfa_amr_claims_session_id_fkey";
ALTER TABLE IF EXISTS ONLY "auth"."identities" DROP CONSTRAINT IF EXISTS "identities_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "_realtime"."extensions" DROP CONSTRAINT IF EXISTS "extensions_tenant_external_id_fkey";
DROP TRIGGER IF EXISTS "update_objects_updated_at" ON "storage"."objects";
DROP TRIGGER IF EXISTS "tr_check_filters" ON "realtime"."subscription";
DROP TRIGGER IF EXISTS "update_users_updated_at" ON "public"."users";
DROP TRIGGER IF EXISTS "update_user_progress_updated_at" ON "public"."user_progress";
DROP TRIGGER IF EXISTS "update_styles_updated_at" ON "public"."styles";
DROP TRIGGER IF EXISTS "update_style_options_updated_at" ON "public"."style_options";
DROP TRIGGER IF EXISTS "update_style_configs_updated_at" ON "public"."style_configs";
DROP TRIGGER IF EXISTS "update_sessions_updated_at" ON "public"."sessions";
DROP TRIGGER IF EXISTS "update_orders_updated_at" ON "public"."orders";
DROP TRIGGER IF EXISTS "update_images_updated_at" ON "public"."images";
DROP TRIGGER IF EXISTS "update_completed_user_journeys_updated_at" ON "public"."completed_user_journeys";
DROP TRIGGER IF EXISTS "set_style_id" ON "public"."styles";
DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";
DROP INDEX IF EXISTS "supabase_functions"."supabase_functions_hooks_request_id_idx";
DROP INDEX IF EXISTS "supabase_functions"."supabase_functions_hooks_h_table_id_h_name_idx";
DROP INDEX IF EXISTS "storage"."name_prefix_search";
DROP INDEX IF EXISTS "storage"."idx_objects_bucket_id_name";
DROP INDEX IF EXISTS "storage"."idx_multipart_uploads_list";
DROP INDEX IF EXISTS "storage"."bucketid_objname";
DROP INDEX IF EXISTS "storage"."bname";
DROP INDEX IF EXISTS "realtime"."subscription_subscription_id_entity_filters_key";
DROP INDEX IF EXISTS "realtime"."ix_realtime_subscription_entity";
DROP INDEX IF EXISTS "auth"."users_is_anonymous_idx";
DROP INDEX IF EXISTS "auth"."users_instance_id_idx";
DROP INDEX IF EXISTS "auth"."users_instance_id_email_idx";
DROP INDEX IF EXISTS "auth"."users_email_partial_key";
DROP INDEX IF EXISTS "auth"."user_id_created_at_idx";
DROP INDEX IF EXISTS "auth"."unique_phone_factor_per_user";
DROP INDEX IF EXISTS "auth"."sso_providers_resource_id_idx";
DROP INDEX IF EXISTS "auth"."sso_domains_sso_provider_id_idx";
DROP INDEX IF EXISTS "auth"."sso_domains_domain_idx";
DROP INDEX IF EXISTS "auth"."sessions_user_id_idx";
DROP INDEX IF EXISTS "auth"."sessions_not_after_idx";
DROP INDEX IF EXISTS "auth"."saml_relay_states_sso_provider_id_idx";
DROP INDEX IF EXISTS "auth"."saml_relay_states_for_email_idx";
DROP INDEX IF EXISTS "auth"."saml_relay_states_created_at_idx";
DROP INDEX IF EXISTS "auth"."saml_providers_sso_provider_id_idx";
DROP INDEX IF EXISTS "auth"."refresh_tokens_updated_at_idx";
DROP INDEX IF EXISTS "auth"."refresh_tokens_session_id_revoked_idx";
DROP INDEX IF EXISTS "auth"."refresh_tokens_parent_idx";
DROP INDEX IF EXISTS "auth"."refresh_tokens_instance_id_user_id_idx";
DROP INDEX IF EXISTS "auth"."refresh_tokens_instance_id_idx";
DROP INDEX IF EXISTS "auth"."recovery_token_idx";
DROP INDEX IF EXISTS "auth"."reauthentication_token_idx";
DROP INDEX IF EXISTS "auth"."one_time_tokens_user_id_token_type_key";
DROP INDEX IF EXISTS "auth"."one_time_tokens_token_hash_hash_idx";
DROP INDEX IF EXISTS "auth"."one_time_tokens_relates_to_hash_idx";
DROP INDEX IF EXISTS "auth"."mfa_factors_user_id_idx";
DROP INDEX IF EXISTS "auth"."mfa_factors_user_friendly_name_unique";
DROP INDEX IF EXISTS "auth"."mfa_challenge_created_at_idx";
DROP INDEX IF EXISTS "auth"."idx_user_id_auth_method";
DROP INDEX IF EXISTS "auth"."idx_auth_code";
DROP INDEX IF EXISTS "auth"."identities_user_id_idx";
DROP INDEX IF EXISTS "auth"."identities_email_idx";
DROP INDEX IF EXISTS "auth"."flow_state_created_at_idx";
DROP INDEX IF EXISTS "auth"."factor_id_created_at_idx";
DROP INDEX IF EXISTS "auth"."email_change_token_new_idx";
DROP INDEX IF EXISTS "auth"."email_change_token_current_idx";
DROP INDEX IF EXISTS "auth"."confirmation_token_idx";
DROP INDEX IF EXISTS "auth"."audit_logs_instance_id_idx";
DROP INDEX IF EXISTS "_realtime"."tenants_external_id_index";
DROP INDEX IF EXISTS "_realtime"."extensions_tenant_external_id_type_index";
DROP INDEX IF EXISTS "_realtime"."extensions_tenant_external_id_index";
ALTER TABLE IF EXISTS ONLY "supabase_migrations"."seed_files" DROP CONSTRAINT IF EXISTS "seed_files_pkey";
ALTER TABLE IF EXISTS ONLY "supabase_migrations"."schema_migrations" DROP CONSTRAINT IF EXISTS "schema_migrations_pkey";
ALTER TABLE IF EXISTS ONLY "supabase_functions"."migrations" DROP CONSTRAINT IF EXISTS "migrations_pkey";
ALTER TABLE IF EXISTS ONLY "supabase_functions"."hooks" DROP CONSTRAINT IF EXISTS "hooks_pkey";
ALTER TABLE IF EXISTS ONLY "storage"."s3_multipart_uploads" DROP CONSTRAINT IF EXISTS "s3_multipart_uploads_pkey";
ALTER TABLE IF EXISTS ONLY "storage"."s3_multipart_uploads_parts" DROP CONSTRAINT IF EXISTS "s3_multipart_uploads_parts_pkey";
ALTER TABLE IF EXISTS ONLY "storage"."objects" DROP CONSTRAINT IF EXISTS "objects_pkey";
ALTER TABLE IF EXISTS ONLY "storage"."migrations" DROP CONSTRAINT IF EXISTS "migrations_pkey";
ALTER TABLE IF EXISTS ONLY "storage"."migrations" DROP CONSTRAINT IF EXISTS "migrations_name_key";
ALTER TABLE IF EXISTS ONLY "storage"."buckets" DROP CONSTRAINT IF EXISTS "buckets_pkey";
ALTER TABLE IF EXISTS ONLY "realtime"."schema_migrations" DROP CONSTRAINT IF EXISTS "schema_migrations_pkey";
ALTER TABLE IF EXISTS ONLY "realtime"."subscription" DROP CONSTRAINT IF EXISTS "pk_subscription";
ALTER TABLE IF EXISTS ONLY "realtime"."messages_2025_05_06" DROP CONSTRAINT IF EXISTS "messages_2025_05_06_pkey";
ALTER TABLE IF EXISTS ONLY "realtime"."messages_2025_05_05" DROP CONSTRAINT IF EXISTS "messages_2025_05_05_pkey";
ALTER TABLE IF EXISTS ONLY "realtime"."messages_2025_05_04" DROP CONSTRAINT IF EXISTS "messages_2025_05_04_pkey";
ALTER TABLE IF EXISTS ONLY "realtime"."messages_2025_05_03" DROP CONSTRAINT IF EXISTS "messages_2025_05_03_pkey";
ALTER TABLE IF EXISTS ONLY "realtime"."messages_2025_05_02" DROP CONSTRAINT IF EXISTS "messages_2025_05_02_pkey";
ALTER TABLE IF EXISTS ONLY "realtime"."messages" DROP CONSTRAINT IF EXISTS "messages_pkey";
ALTER TABLE IF EXISTS ONLY "public"."users" DROP CONSTRAINT IF EXISTS "users_pkey";
ALTER TABLE IF EXISTS ONLY "public"."user_progress" DROP CONSTRAINT IF EXISTS "user_progress_user_id_key";
ALTER TABLE IF EXISTS ONLY "public"."user_progress" DROP CONSTRAINT IF EXISTS "user_progress_pkey";
ALTER TABLE IF EXISTS ONLY "public"."user_language_preferences" DROP CONSTRAINT IF EXISTS "user_language_preferences_pkey";
ALTER TABLE IF EXISTS ONLY "public"."styles" DROP CONSTRAINT IF EXISTS "styles_pkey";
ALTER TABLE IF EXISTS ONLY "public"."style_options" DROP CONSTRAINT IF EXISTS "style_options_pkey";
ALTER TABLE IF EXISTS ONLY "public"."style_options" DROP CONSTRAINT IF EXISTS "style_options_category_unique";
ALTER TABLE IF EXISTS ONLY "public"."style_configs" DROP CONSTRAINT IF EXISTS "style_configs_pkey";
ALTER TABLE IF EXISTS ONLY "public"."sessions" DROP CONSTRAINT IF EXISTS "sessions_pkey";
ALTER TABLE IF EXISTS ONLY "public"."orders" DROP CONSTRAINT IF EXISTS "orders_pkey";
ALTER TABLE IF EXISTS ONLY "public"."images" DROP CONSTRAINT IF EXISTS "images_pkey";
ALTER TABLE IF EXISTS ONLY "public"."completed_user_journeys" DROP CONSTRAINT IF EXISTS "completed_user_journeys_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."users" DROP CONSTRAINT IF EXISTS "users_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."users" DROP CONSTRAINT IF EXISTS "users_phone_key";
ALTER TABLE IF EXISTS ONLY "auth"."sso_providers" DROP CONSTRAINT IF EXISTS "sso_providers_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."sso_domains" DROP CONSTRAINT IF EXISTS "sso_domains_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."sessions" DROP CONSTRAINT IF EXISTS "sessions_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."schema_migrations" DROP CONSTRAINT IF EXISTS "schema_migrations_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."saml_relay_states" DROP CONSTRAINT IF EXISTS "saml_relay_states_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."saml_providers" DROP CONSTRAINT IF EXISTS "saml_providers_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."saml_providers" DROP CONSTRAINT IF EXISTS "saml_providers_entity_id_key";
ALTER TABLE IF EXISTS ONLY "auth"."refresh_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_token_unique";
ALTER TABLE IF EXISTS ONLY "auth"."refresh_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."one_time_tokens" DROP CONSTRAINT IF EXISTS "one_time_tokens_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_factors" DROP CONSTRAINT IF EXISTS "mfa_factors_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_factors" DROP CONSTRAINT IF EXISTS "mfa_factors_last_challenged_at_key";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_challenges" DROP CONSTRAINT IF EXISTS "mfa_challenges_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_amr_claims" DROP CONSTRAINT IF EXISTS "mfa_amr_claims_session_id_authentication_method_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."instances" DROP CONSTRAINT IF EXISTS "instances_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."identities" DROP CONSTRAINT IF EXISTS "identities_provider_id_provider_unique";
ALTER TABLE IF EXISTS ONLY "auth"."identities" DROP CONSTRAINT IF EXISTS "identities_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."flow_state" DROP CONSTRAINT IF EXISTS "flow_state_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."audit_log_entries" DROP CONSTRAINT IF EXISTS "audit_log_entries_pkey";
ALTER TABLE IF EXISTS ONLY "auth"."mfa_amr_claims" DROP CONSTRAINT IF EXISTS "amr_id_pk";
ALTER TABLE IF EXISTS ONLY "_realtime"."tenants" DROP CONSTRAINT IF EXISTS "tenants_pkey";
ALTER TABLE IF EXISTS ONLY "_realtime"."schema_migrations" DROP CONSTRAINT IF EXISTS "schema_migrations_pkey";
ALTER TABLE IF EXISTS ONLY "_realtime"."extensions" DROP CONSTRAINT IF EXISTS "extensions_pkey";
ALTER TABLE IF EXISTS "supabase_functions"."hooks" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "auth"."refresh_tokens" ALTER COLUMN "id" DROP DEFAULT;
DROP TABLE IF EXISTS "supabase_migrations"."seed_files";
DROP TABLE IF EXISTS "supabase_migrations"."schema_migrations";
DROP TABLE IF EXISTS "supabase_functions"."migrations";
DROP SEQUENCE IF EXISTS "supabase_functions"."hooks_id_seq";
DROP TABLE IF EXISTS "supabase_functions"."hooks";
DROP TABLE IF EXISTS "storage"."s3_multipart_uploads_parts";
DROP TABLE IF EXISTS "storage"."s3_multipart_uploads";
DROP TABLE IF EXISTS "storage"."objects";
DROP TABLE IF EXISTS "storage"."migrations";
DROP TABLE IF EXISTS "storage"."buckets";
DROP TABLE IF EXISTS "realtime"."subscription";
DROP TABLE IF EXISTS "realtime"."schema_migrations";
DROP TABLE IF EXISTS "realtime"."messages_2025_05_06";
DROP TABLE IF EXISTS "realtime"."messages_2025_05_05";
DROP TABLE IF EXISTS "realtime"."messages_2025_05_04";
DROP TABLE IF EXISTS "realtime"."messages_2025_05_03";
DROP TABLE IF EXISTS "realtime"."messages_2025_05_02";
DROP TABLE IF EXISTS "realtime"."messages";
DROP TABLE IF EXISTS "public"."users";
DROP TABLE IF EXISTS "public"."user_progress";
DROP TABLE IF EXISTS "public"."user_language_preferences";
DROP TABLE IF EXISTS "public"."styles";
DROP TABLE IF EXISTS "public"."style_options";
DROP TABLE IF EXISTS "public"."style_configs";
DROP TABLE IF EXISTS "public"."sessions";
DROP TABLE IF EXISTS "public"."orders";
DROP TABLE IF EXISTS "public"."images";
DROP TABLE IF EXISTS "public"."completed_user_journeys";
DROP TABLE IF EXISTS "auth"."users";
DROP TABLE IF EXISTS "auth"."sso_providers";
DROP TABLE IF EXISTS "auth"."sso_domains";
DROP TABLE IF EXISTS "auth"."sessions";
DROP TABLE IF EXISTS "auth"."schema_migrations";
DROP TABLE IF EXISTS "auth"."saml_relay_states";
DROP TABLE IF EXISTS "auth"."saml_providers";
DROP SEQUENCE IF EXISTS "auth"."refresh_tokens_id_seq";
DROP TABLE IF EXISTS "auth"."refresh_tokens";
DROP TABLE IF EXISTS "auth"."one_time_tokens";
DROP TABLE IF EXISTS "auth"."mfa_factors";
DROP TABLE IF EXISTS "auth"."mfa_challenges";
DROP TABLE IF EXISTS "auth"."mfa_amr_claims";
DROP TABLE IF EXISTS "auth"."instances";
DROP TABLE IF EXISTS "auth"."identities";
DROP TABLE IF EXISTS "auth"."flow_state";
DROP TABLE IF EXISTS "auth"."audit_log_entries";
DROP TABLE IF EXISTS "_realtime"."tenants";
DROP TABLE IF EXISTS "_realtime"."schema_migrations";
DROP TABLE IF EXISTS "_realtime"."extensions";
DROP FUNCTION IF EXISTS "supabase_functions"."http_request"();
DROP FUNCTION IF EXISTS "storage"."update_updated_at_column"();
DROP FUNCTION IF EXISTS "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text");
DROP FUNCTION IF EXISTS "storage"."operation"();
DROP FUNCTION IF EXISTS "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text");
DROP FUNCTION IF EXISTS "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text");
DROP FUNCTION IF EXISTS "storage"."get_size_by_bucket"();
DROP FUNCTION IF EXISTS "storage"."foldername"("name" "text");
DROP FUNCTION IF EXISTS "storage"."filename"("name" "text");
DROP FUNCTION IF EXISTS "storage"."extension"("name" "text");
DROP FUNCTION IF EXISTS "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb");
DROP FUNCTION IF EXISTS "realtime"."topic"();
DROP FUNCTION IF EXISTS "realtime"."to_regrole"("role_name" "text");
DROP FUNCTION IF EXISTS "realtime"."subscription_check_filters"();
DROP FUNCTION IF EXISTS "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean);
DROP FUNCTION IF EXISTS "realtime"."quote_wal2json"("entity" "regclass");
DROP FUNCTION IF EXISTS "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer);
DROP FUNCTION IF EXISTS "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]);
DROP FUNCTION IF EXISTS "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text");
DROP FUNCTION IF EXISTS "realtime"."cast"("val" "text", "type_" "regtype");
DROP FUNCTION IF EXISTS "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]);
DROP FUNCTION IF EXISTS "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text");
DROP FUNCTION IF EXISTS "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer);
DROP FUNCTION IF EXISTS "public"."update_updated_at_column"();
DROP FUNCTION IF EXISTS "public"."update_language_preference"("new_language" character varying);
DROP FUNCTION IF EXISTS "public"."handle_new_user"();
DROP FUNCTION IF EXISTS "public"."get_language_preference"();
DROP FUNCTION IF EXISTS "public"."generate_style_id"();
DROP FUNCTION IF EXISTS "pgbouncer"."get_auth"("p_usename" "text");
DROP FUNCTION IF EXISTS "extensions"."set_graphql_placeholder"();
DROP FUNCTION IF EXISTS "extensions"."pgrst_drop_watch"();
DROP FUNCTION IF EXISTS "extensions"."pgrst_ddl_watch"();
DROP FUNCTION IF EXISTS "extensions"."grant_pg_net_access"();
DROP FUNCTION IF EXISTS "extensions"."grant_pg_graphql_access"();
DROP FUNCTION IF EXISTS "extensions"."grant_pg_cron_access"();
DROP FUNCTION IF EXISTS "auth"."uid"();
DROP FUNCTION IF EXISTS "auth"."role"();
DROP FUNCTION IF EXISTS "auth"."jwt"();
DROP FUNCTION IF EXISTS "auth"."email"();
DROP TYPE IF EXISTS "realtime"."wal_rls";
DROP TYPE IF EXISTS "realtime"."wal_column";
DROP TYPE IF EXISTS "realtime"."user_defined_filter";
DROP TYPE IF EXISTS "realtime"."equality_op";
DROP TYPE IF EXISTS "realtime"."action";
DROP TYPE IF EXISTS "public"."flow_stage";
DROP TYPE IF EXISTS "auth"."one_time_token_type";
DROP TYPE IF EXISTS "auth"."factor_type";
DROP TYPE IF EXISTS "auth"."factor_status";
DROP TYPE IF EXISTS "auth"."code_challenge_method";
DROP TYPE IF EXISTS "auth"."aal_level";
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS "supabase_vault";
DROP EXTENSION IF EXISTS "pgjwt";
DROP EXTENSION IF EXISTS "pgcrypto";
DROP EXTENSION IF EXISTS "pg_stat_statements";
DROP EXTENSION IF EXISTS "pg_graphql";
DROP SCHEMA IF EXISTS "vault";
DROP SCHEMA IF EXISTS "supabase_migrations";
DROP SCHEMA IF EXISTS "supabase_functions";
DROP SCHEMA IF EXISTS "storage";
DROP SCHEMA IF EXISTS "realtime";
DROP SCHEMA IF EXISTS "pgbouncer";
DROP EXTENSION IF EXISTS "pg_net";
DROP SCHEMA IF EXISTS "graphql_public";
DROP SCHEMA IF EXISTS "graphql";
DROP SCHEMA IF EXISTS "extensions";
DROP SCHEMA IF EXISTS "auth";
DROP SCHEMA IF EXISTS "_realtime";
--
-- Name: _realtime; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA "_realtime";


ALTER SCHEMA "_realtime" OWNER TO "postgres";

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA "auth";


ALTER SCHEMA "auth" OWNER TO "supabase_admin";

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA "extensions";


ALTER SCHEMA "extensions" OWNER TO "postgres";

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA "graphql";


ALTER SCHEMA "graphql" OWNER TO "supabase_admin";

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA "graphql_public";


ALTER SCHEMA "graphql_public" OWNER TO "supabase_admin";

--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pg_net"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pg_net" IS 'Async HTTP';


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA "pgbouncer";


ALTER SCHEMA "pgbouncer" OWNER TO "pgbouncer";

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA "realtime";


ALTER SCHEMA "realtime" OWNER TO "supabase_admin";

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA "storage";


ALTER SCHEMA "storage" OWNER TO "supabase_admin";

--
-- Name: supabase_functions; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA "supabase_functions";


ALTER SCHEMA "supabase_functions" OWNER TO "supabase_admin";

--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA "supabase_migrations";


ALTER SCHEMA "supabase_migrations" OWNER TO "postgres";

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA "vault";


ALTER SCHEMA "vault" OWNER TO "supabase_admin";

--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";


--
-- Name: EXTENSION "pg_graphql"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pg_graphql" IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pg_stat_statements"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pg_stat_statements" IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pgcrypto"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pgcrypto" IS 'cryptographic functions';


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pgjwt"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "pgjwt" IS 'JSON Web Token API for Postgresql';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


--
-- Name: EXTENSION "supabase_vault"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "supabase_vault" IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."aal_level" AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE "auth"."aal_level" OWNER TO "supabase_auth_admin";

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."code_challenge_method" AS ENUM (
    's256',
    'plain'
);


ALTER TYPE "auth"."code_challenge_method" OWNER TO "supabase_auth_admin";

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."factor_status" AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE "auth"."factor_status" OWNER TO "supabase_auth_admin";

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."factor_type" AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE "auth"."factor_type" OWNER TO "supabase_auth_admin";

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE "auth"."one_time_token_type" AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE "auth"."one_time_token_type" OWNER TO "supabase_auth_admin";

--
-- Name: flow_stage; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."flow_stage" AS ENUM (
    'shoot',
    'payment',
    'upload',
    'review',
    'albums'
);


ALTER TYPE "public"."flow_stage" OWNER TO "postgres";

--
-- Name: TYPE "flow_stage"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE "public"."flow_stage" IS 'Represents the different stages in the headshot generation workflow';


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE "realtime"."action" AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE "realtime"."action" OWNER TO "supabase_admin";

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE "realtime"."equality_op" AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE "realtime"."equality_op" OWNER TO "supabase_admin";

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE "realtime"."user_defined_filter" AS (
	"column_name" "text",
	"op" "realtime"."equality_op",
	"value" "text"
);


ALTER TYPE "realtime"."user_defined_filter" OWNER TO "supabase_admin";

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE "realtime"."wal_column" AS (
	"name" "text",
	"type_name" "text",
	"type_oid" "oid",
	"value" "jsonb",
	"is_pkey" boolean,
	"is_selectable" boolean
);


ALTER TYPE "realtime"."wal_column" OWNER TO "supabase_admin";

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE "realtime"."wal_rls" AS (
	"wal" "jsonb",
	"is_rls_enabled" boolean,
	"subscription_ids" "uuid"[],
	"errors" "text"[]
);


ALTER TYPE "realtime"."wal_rls" OWNER TO "supabase_admin";

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION "auth"."email"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION "auth"."email"() OWNER TO "supabase_auth_admin";

--
-- Name: FUNCTION "email"(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION "auth"."email"() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION "auth"."jwt"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION "auth"."jwt"() OWNER TO "supabase_auth_admin";

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION "auth"."role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION "auth"."role"() OWNER TO "supabase_auth_admin";

--
-- Name: FUNCTION "role"(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION "auth"."role"() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION "auth"."uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION "auth"."uid"() OWNER TO "supabase_auth_admin";

--
-- Name: FUNCTION "uid"(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION "auth"."uid"() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: postgres
--

CREATE FUNCTION "extensions"."grant_pg_cron_access"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION "extensions"."grant_pg_cron_access"() OWNER TO "postgres";

--
-- Name: FUNCTION "grant_pg_cron_access"(); Type: COMMENT; Schema: extensions; Owner: postgres
--

COMMENT ON FUNCTION "extensions"."grant_pg_cron_access"() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION "extensions"."grant_pg_graphql_access"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION "extensions"."grant_pg_graphql_access"() OWNER TO "supabase_admin";

--
-- Name: FUNCTION "grant_pg_graphql_access"(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION "extensions"."grant_pg_graphql_access"() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: postgres
--

CREATE FUNCTION "extensions"."grant_pg_net_access"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

    REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

    GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
  END IF;
END;
$$;


ALTER FUNCTION "extensions"."grant_pg_net_access"() OWNER TO "postgres";

--
-- Name: FUNCTION "grant_pg_net_access"(); Type: COMMENT; Schema: extensions; Owner: postgres
--

COMMENT ON FUNCTION "extensions"."grant_pg_net_access"() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION "extensions"."pgrst_ddl_watch"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION "extensions"."pgrst_ddl_watch"() OWNER TO "supabase_admin";

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION "extensions"."pgrst_drop_watch"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION "extensions"."pgrst_drop_watch"() OWNER TO "supabase_admin";

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION "extensions"."set_graphql_placeholder"() RETURNS "event_trigger"
    LANGUAGE "plpgsql"
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION "extensions"."set_graphql_placeholder"() OWNER TO "supabase_admin";

--
-- Name: FUNCTION "set_graphql_placeholder"(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION "extensions"."set_graphql_placeholder"() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth("text"); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION "pgbouncer"."get_auth"("p_usename" "text") RETURNS TABLE("username" "text", "password" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RAISE WARNING 'PgBouncer auth request: %', p_usename;

    RETURN QUERY
    SELECT usename::TEXT, passwd::TEXT FROM pg_catalog.pg_shadow
    WHERE usename = p_usename;
END;
$$;


ALTER FUNCTION "pgbouncer"."get_auth"("p_usename" "text") OWNER TO "supabase_admin";

--
-- Name: generate_style_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."generate_style_id"() RETURNS "trigger"
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

--
-- Name: FUNCTION "generate_style_id"(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION "public"."generate_style_id"() IS 'Automatically generates a unique style ID for new styles';


--
-- Name: get_language_preference(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."get_language_preference"() RETURNS character varying
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

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
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

--
-- Name: update_language_preference(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."update_language_preference"("new_language" character varying) RETURNS "void"
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

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

--
-- Name: apply_rls("jsonb", integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer DEFAULT (1024 * 1024)) RETURNS SETOF "realtime"."wal_rls"
    LANGUAGE "plpgsql"
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) OWNER TO "supabase_admin";

--
-- Name: broadcast_changes("text", "text", "text", "text", "text", "record", "record", "text"); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text" DEFAULT 'ROW'::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text") OWNER TO "supabase_admin";

--
-- Name: build_prepared_statement_sql("text", "regclass", "realtime"."wal_column"[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) RETURNS "text"
    LANGUAGE "sql"
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) OWNER TO "supabase_admin";

--
-- Name: cast("text", "regtype"); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") RETURNS "jsonb"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


ALTER FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") OWNER TO "supabase_admin";

--
-- Name: check_equality_op("realtime"."equality_op", "regtype", "text", "text"); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") OWNER TO "supabase_admin";

--
-- Name: is_visible_through_filters("realtime"."wal_column"[], "realtime"."user_defined_filter"[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) OWNER TO "supabase_admin";

--
-- Name: list_changes("name", "name", integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) RETURNS SETOF "realtime"."wal_rls"
    LANGUAGE "sql"
    SET "log_min_messages" TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) OWNER TO "supabase_admin";

--
-- Name: quote_wal2json("regclass"); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."quote_wal2json"("entity" "regclass") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION "realtime"."quote_wal2json"("entity" "regclass") OWNER TO "supabase_admin";

--
-- Name: send("jsonb", "text", "text", boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean DEFAULT true) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      PERFORM pg_notify(
          'realtime:system',
          jsonb_build_object(
              'error', SQLERRM,
              'function', 'realtime.send',
              'event', event,
              'topic', topic,
              'private', private
          )::text
      );
  END;
END;
$$;


ALTER FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean) OWNER TO "supabase_admin";

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."subscription_check_filters"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION "realtime"."subscription_check_filters"() OWNER TO "supabase_admin";

--
-- Name: to_regrole("text"); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION "realtime"."to_regrole"("role_name" "text") RETURNS "regrole"
    LANGUAGE "sql" IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION "realtime"."to_regrole"("role_name" "text") OWNER TO "supabase_admin";

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION "realtime"."topic"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION "realtime"."topic"() OWNER TO "supabase_realtime_admin";

--
-- Name: can_insert_object("text", "text", "uuid", "jsonb"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") OWNER TO "supabase_storage_admin";

--
-- Name: extension("text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."extension"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION "storage"."extension"("name" "text") OWNER TO "supabase_storage_admin";

--
-- Name: filename("text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."filename"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION "storage"."filename"("name" "text") OWNER TO "supabase_storage_admin";

--
-- Name: foldername("text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."foldername"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


ALTER FUNCTION "storage"."foldername"("name" "text") OWNER TO "supabase_storage_admin";

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."get_size_by_bucket"() RETURNS TABLE("size" bigint, "bucket_id" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION "storage"."get_size_by_bucket"() OWNER TO "supabase_storage_admin";

--
-- Name: list_multipart_uploads_with_delimiter("text", "text", "text", integer, "text", "text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "next_key_token" "text" DEFAULT ''::"text", "next_upload_token" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "id" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text") OWNER TO "supabase_storage_admin";

--
-- Name: list_objects_with_delimiter("text", "text", "text", integer, "text", "text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "start_after" "text" DEFAULT ''::"text", "next_token" "text" DEFAULT ''::"text") RETURNS TABLE("name" "text", "id" "uuid", "metadata" "jsonb", "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text") OWNER TO "supabase_storage_admin";

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."operation"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION "storage"."operation"() OWNER TO "supabase_storage_admin";

--
-- Name: search("text", "text", integer, integer, integer, "text", "text", "text"); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION "storage"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION "storage"."update_updated_at_column"() OWNER TO "supabase_storage_admin";

--
-- Name: http_request(); Type: FUNCTION; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE FUNCTION "supabase_functions"."http_request"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'supabase_functions'
    AS $$
  DECLARE
    request_id bigint;
    payload jsonb;
    url text := TG_ARGV[0]::text;
    method text := TG_ARGV[1]::text;
    headers jsonb DEFAULT '{}'::jsonb;
    params jsonb DEFAULT '{}'::jsonb;
    timeout_ms integer DEFAULT 1000;
  BEGIN
    IF url IS NULL OR url = 'null' THEN
      RAISE EXCEPTION 'url argument is missing';
    END IF;

    IF method IS NULL OR method = 'null' THEN
      RAISE EXCEPTION 'method argument is missing';
    END IF;

    IF TG_ARGV[2] IS NULL OR TG_ARGV[2] = 'null' THEN
      headers = '{"Content-Type": "application/json"}'::jsonb;
    ELSE
      headers = TG_ARGV[2]::jsonb;
    END IF;

    IF TG_ARGV[3] IS NULL OR TG_ARGV[3] = 'null' THEN
      params = '{}'::jsonb;
    ELSE
      params = TG_ARGV[3]::jsonb;
    END IF;

    IF TG_ARGV[4] IS NULL OR TG_ARGV[4] = 'null' THEN
      timeout_ms = 1000;
    ELSE
      timeout_ms = TG_ARGV[4]::integer;
    END IF;

    CASE
      WHEN method = 'GET' THEN
        SELECT http_get INTO request_id FROM net.http_get(
          url,
          params,
          headers,
          timeout_ms
        );
      WHEN method = 'POST' THEN
        payload = jsonb_build_object(
          'old_record', OLD,
          'record', NEW,
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA
        );

        SELECT http_post INTO request_id FROM net.http_post(
          url,
          payload,
          params,
          headers,
          timeout_ms
        );
      ELSE
        RAISE EXCEPTION 'method argument % is invalid', method;
    END CASE;

    INSERT INTO supabase_functions.hooks
      (hook_table_id, hook_name, request_id)
    VALUES
      (TG_RELID, TG_NAME, request_id);

    RETURN NEW;
  END
$$;


ALTER FUNCTION "supabase_functions"."http_request"() OWNER TO "supabase_functions_admin";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: extensions; Type: TABLE; Schema: _realtime; Owner: supabase_admin
--

CREATE TABLE "_realtime"."extensions" (
    "id" "uuid" NOT NULL,
    "type" "text",
    "settings" "jsonb",
    "tenant_external_id" "text",
    "inserted_at" timestamp(0) without time zone NOT NULL,
    "updated_at" timestamp(0) without time zone NOT NULL
);


ALTER TABLE "_realtime"."extensions" OWNER TO "supabase_admin";

--
-- Name: schema_migrations; Type: TABLE; Schema: _realtime; Owner: supabase_admin
--

CREATE TABLE "_realtime"."schema_migrations" (
    "version" bigint NOT NULL,
    "inserted_at" timestamp(0) without time zone
);


ALTER TABLE "_realtime"."schema_migrations" OWNER TO "supabase_admin";

--
-- Name: tenants; Type: TABLE; Schema: _realtime; Owner: supabase_admin
--

CREATE TABLE "_realtime"."tenants" (
    "id" "uuid" NOT NULL,
    "name" "text",
    "external_id" "text",
    "jwt_secret" "text",
    "max_concurrent_users" integer DEFAULT 200 NOT NULL,
    "inserted_at" timestamp(0) without time zone NOT NULL,
    "updated_at" timestamp(0) without time zone NOT NULL,
    "max_events_per_second" integer DEFAULT 100 NOT NULL,
    "postgres_cdc_default" "text" DEFAULT 'postgres_cdc_rls'::"text",
    "max_bytes_per_second" integer DEFAULT 100000 NOT NULL,
    "max_channels_per_client" integer DEFAULT 100 NOT NULL,
    "max_joins_per_second" integer DEFAULT 500 NOT NULL,
    "suspend" boolean DEFAULT false,
    "jwt_jwks" "jsonb",
    "notify_private_alpha" boolean DEFAULT false,
    "private_only" boolean DEFAULT false NOT NULL
);


ALTER TABLE "_realtime"."tenants" OWNER TO "supabase_admin";

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."audit_log_entries" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "payload" "json",
    "created_at" timestamp with time zone,
    "ip_address" character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE "auth"."audit_log_entries" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "audit_log_entries"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."audit_log_entries" IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."flow_state" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "auth_code" "text" NOT NULL,
    "code_challenge_method" "auth"."code_challenge_method" NOT NULL,
    "code_challenge" "text" NOT NULL,
    "provider_type" "text" NOT NULL,
    "provider_access_token" "text",
    "provider_refresh_token" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "authentication_method" "text" NOT NULL,
    "auth_code_issued_at" timestamp with time zone
);


ALTER TABLE "auth"."flow_state" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "flow_state"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."flow_state" IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."identities" (
    "provider_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "identity_data" "jsonb" NOT NULL,
    "provider" "text" NOT NULL,
    "last_sign_in_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "email" "text" GENERATED ALWAYS AS ("lower"(("identity_data" ->> 'email'::"text"))) STORED,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "auth"."identities" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "identities"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."identities" IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN "identities"."email"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN "auth"."identities"."email" IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."instances" (
    "id" "uuid" NOT NULL,
    "uuid" "uuid",
    "raw_base_config" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "auth"."instances" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "instances"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."instances" IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."mfa_amr_claims" (
    "session_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "authentication_method" "text" NOT NULL,
    "id" "uuid" NOT NULL
);


ALTER TABLE "auth"."mfa_amr_claims" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "mfa_amr_claims"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."mfa_amr_claims" IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."mfa_challenges" (
    "id" "uuid" NOT NULL,
    "factor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "verified_at" timestamp with time zone,
    "ip_address" "inet" NOT NULL,
    "otp_code" "text",
    "web_authn_session_data" "jsonb"
);


ALTER TABLE "auth"."mfa_challenges" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "mfa_challenges"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."mfa_challenges" IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."mfa_factors" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friendly_name" "text",
    "factor_type" "auth"."factor_type" NOT NULL,
    "status" "auth"."factor_status" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "secret" "text",
    "phone" "text",
    "last_challenged_at" timestamp with time zone,
    "web_authn_credential" "jsonb",
    "web_authn_aaguid" "uuid"
);


ALTER TABLE "auth"."mfa_factors" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "mfa_factors"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."mfa_factors" IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."one_time_tokens" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_type" "auth"."one_time_token_type" NOT NULL,
    "token_hash" "text" NOT NULL,
    "relates_to" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "one_time_tokens_token_hash_check" CHECK (("char_length"("token_hash") > 0))
);


ALTER TABLE "auth"."one_time_tokens" OWNER TO "supabase_auth_admin";

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."refresh_tokens" (
    "instance_id" "uuid",
    "id" bigint NOT NULL,
    "token" character varying(255),
    "user_id" character varying(255),
    "revoked" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "parent" character varying(255),
    "session_id" "uuid"
);


ALTER TABLE "auth"."refresh_tokens" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "refresh_tokens"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."refresh_tokens" IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE "auth"."refresh_tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "auth"."refresh_tokens_id_seq" OWNER TO "supabase_auth_admin";

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE "auth"."refresh_tokens_id_seq" OWNED BY "auth"."refresh_tokens"."id";


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."saml_providers" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "entity_id" "text" NOT NULL,
    "metadata_xml" "text" NOT NULL,
    "metadata_url" "text",
    "attribute_mapping" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "name_id_format" "text",
    CONSTRAINT "entity_id not empty" CHECK (("char_length"("entity_id") > 0)),
    CONSTRAINT "metadata_url not empty" CHECK ((("metadata_url" = NULL::"text") OR ("char_length"("metadata_url") > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK (("char_length"("metadata_xml") > 0))
);


ALTER TABLE "auth"."saml_providers" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "saml_providers"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."saml_providers" IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."saml_relay_states" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "request_id" "text" NOT NULL,
    "for_email" "text",
    "redirect_to" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "flow_state_id" "uuid",
    CONSTRAINT "request_id not empty" CHECK (("char_length"("request_id") > 0))
);


ALTER TABLE "auth"."saml_relay_states" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "saml_relay_states"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."saml_relay_states" IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."schema_migrations" (
    "version" character varying(255) NOT NULL
);


ALTER TABLE "auth"."schema_migrations" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "schema_migrations"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."schema_migrations" IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."sessions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "factor_id" "uuid",
    "aal" "auth"."aal_level",
    "not_after" timestamp with time zone,
    "refreshed_at" timestamp without time zone,
    "user_agent" "text",
    "ip" "inet",
    "tag" "text"
);


ALTER TABLE "auth"."sessions" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "sessions"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."sessions" IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN "sessions"."not_after"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN "auth"."sessions"."not_after" IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."sso_domains" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "domain" "text" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK (("char_length"("domain") > 0))
);


ALTER TABLE "auth"."sso_domains" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "sso_domains"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."sso_domains" IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."sso_providers" (
    "id" "uuid" NOT NULL,
    "resource_id" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK ((("resource_id" = NULL::"text") OR ("char_length"("resource_id") > 0)))
);


ALTER TABLE "auth"."sso_providers" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "sso_providers"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."sso_providers" IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN "sso_providers"."resource_id"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN "auth"."sso_providers"."resource_id" IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE "auth"."users" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "aud" character varying(255),
    "role" character varying(255),
    "email" character varying(255),
    "encrypted_password" character varying(255),
    "email_confirmed_at" timestamp with time zone,
    "invited_at" timestamp with time zone,
    "confirmation_token" character varying(255),
    "confirmation_sent_at" timestamp with time zone,
    "recovery_token" character varying(255),
    "recovery_sent_at" timestamp with time zone,
    "email_change_token_new" character varying(255),
    "email_change" character varying(255),
    "email_change_sent_at" timestamp with time zone,
    "last_sign_in_at" timestamp with time zone,
    "raw_app_meta_data" "jsonb",
    "raw_user_meta_data" "jsonb",
    "is_super_admin" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "phone" "text" DEFAULT NULL::character varying,
    "phone_confirmed_at" timestamp with time zone,
    "phone_change" "text" DEFAULT ''::character varying,
    "phone_change_token" character varying(255) DEFAULT ''::character varying,
    "phone_change_sent_at" timestamp with time zone,
    "confirmed_at" timestamp with time zone GENERATED ALWAYS AS (LEAST("email_confirmed_at", "phone_confirmed_at")) STORED,
    "email_change_token_current" character varying(255) DEFAULT ''::character varying,
    "email_change_confirm_status" smallint DEFAULT 0,
    "banned_until" timestamp with time zone,
    "reauthentication_token" character varying(255) DEFAULT ''::character varying,
    "reauthentication_sent_at" timestamp with time zone,
    "is_sso_user" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_anonymous" boolean DEFAULT false NOT NULL,
    CONSTRAINT "users_email_change_confirm_status_check" CHECK ((("email_change_confirm_status" >= 0) AND ("email_change_confirm_status" <= 2)))
);


ALTER TABLE "auth"."users" OWNER TO "supabase_auth_admin";

--
-- Name: TABLE "users"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE "auth"."users" IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN "users"."is_sso_user"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN "auth"."users"."is_sso_user" IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: completed_user_journeys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."completed_user_journeys" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "journey_data" "jsonb" NOT NULL,
    "completed_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."completed_user_journeys" OWNER TO "postgres";

--
-- Name: TABLE "completed_user_journeys"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."completed_user_journeys" IS 'Archives completed headshot generation workflows';


--
-- Name: COLUMN "completed_user_journeys"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."completed_user_journeys"."id" IS 'Unique identifier for the completed journey';


--
-- Name: COLUMN "completed_user_journeys"."user_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."completed_user_journeys"."user_id" IS 'Reference to the user who completed the journey';


--
-- Name: COLUMN "completed_user_journeys"."journey_data"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."completed_user_journeys"."journey_data" IS 'JSON data containing the complete journey details';


--
-- Name: COLUMN "completed_user_journeys"."completed_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."completed_user_journeys"."completed_at" IS 'Timestamp when the journey was completed';


--
-- Name: COLUMN "completed_user_journeys"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."completed_user_journeys"."created_at" IS 'Timestamp when the journey record was created';


--
-- Name: COLUMN "completed_user_journeys"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."completed_user_journeys"."updated_at" IS 'Timestamp when the journey record was last updated';


--
-- Name: images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."images" (
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

--
-- Name: TABLE "images"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."images" IS 'Stores user-uploaded images and their metadata';


--
-- Name: COLUMN "images"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."images"."id" IS 'Unique identifier for the image';


--
-- Name: COLUMN "images"."user_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."images"."user_id" IS 'Reference to the user who owns the image';


--
-- Name: COLUMN "images"."url"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."images"."url" IS 'Public URL where the image can be accessed';


--
-- Name: COLUMN "images"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."images"."created_at" IS 'Timestamp when the image was uploaded';


--
-- Name: COLUMN "images"."file_name"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."images"."file_name" IS 'Original filename of the uploaded image';


--
-- Name: COLUMN "images"."file_size"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."images"."file_size" IS 'Size of the image file in bytes';


--
-- Name: COLUMN "images"."mime_type"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."images"."mime_type" IS 'MIME type of the image (e.g., image/jpeg)';


--
-- Name: COLUMN "images"."dimensions"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."images"."dimensions" IS 'Image dimensions stored as JSON {width: number, height: number}';


--
-- Name: COLUMN "images"."order_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."images"."order_id" IS 'Reference to the order this image belongs to';


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."orders" (
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

--
-- Name: TABLE "orders"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."orders" IS 'Stores headshot orders and their payment/processing status';


--
-- Name: COLUMN "orders"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."id" IS 'Unique identifier for the order';


--
-- Name: COLUMN "orders"."user_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."user_id" IS 'Reference to the user who created the order';


--
-- Name: COLUMN "orders"."status"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."status" IS 'Current status of the order (draft, pending_payment, paid, processing, completed, cancelled)';


--
-- Name: COLUMN "orders"."amount"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."amount" IS 'Total amount for the order in smallest currency unit (e.g., cents)';


--
-- Name: COLUMN "orders"."currency"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."currency" IS 'Three-letter currency code (e.g., USD)';


--
-- Name: COLUMN "orders"."payment_intent_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."payment_intent_id" IS 'Stripe payment intent ID for tracking payment status';


--
-- Name: COLUMN "orders"."payment_status"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."payment_status" IS 'Current status of the payment (pending, succeeded, failed)';


--
-- Name: COLUMN "orders"."metadata"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."metadata" IS 'Additional order metadata stored as JSON';


--
-- Name: COLUMN "orders"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."created_at" IS 'Timestamp when the order was created';


--
-- Name: COLUMN "orders"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."updated_at" IS 'Timestamp when the order was last updated';


--
-- Name: COLUMN "orders"."idempotency_key"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."idempotency_key" IS 'Stripe idempotency key used for the most recent payment attempt';


--
-- Name: COLUMN "orders"."checkout_session_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."checkout_session_id" IS 'Stripe checkout session ID for checkout-based payments';


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "expires_at" timestamp with time zone NOT NULL,
    "last_accessed_at" timestamp with time zone
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";

--
-- Name: TABLE "sessions"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."sessions" IS 'Stores user session information for authentication';


--
-- Name: COLUMN "sessions"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."sessions"."id" IS 'Unique identifier for the session';


--
-- Name: COLUMN "sessions"."user_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."sessions"."user_id" IS 'Reference to the user who owns this session';


--
-- Name: COLUMN "sessions"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."sessions"."created_at" IS 'Timestamp when the session was created';


--
-- Name: COLUMN "sessions"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."sessions"."updated_at" IS 'Timestamp when the session was last updated';


--
-- Name: COLUMN "sessions"."expires_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."sessions"."expires_at" IS 'Timestamp when the session expires';


--
-- Name: COLUMN "sessions"."last_accessed_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."sessions"."last_accessed_at" IS 'Timestamp when the session was last accessed';


--
-- Name: style_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."style_configs" (
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

--
-- Name: TABLE "style_configs"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."style_configs" IS 'Stores predefined style configuration templates';


--
-- Name: COLUMN "style_configs"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_configs"."id" IS 'Unique identifier for the style config';


--
-- Name: COLUMN "style_configs"."name"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_configs"."name" IS 'Name of the style configuration';


--
-- Name: COLUMN "style_configs"."tagline"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_configs"."tagline" IS 'Short description or tagline for the style';


--
-- Name: COLUMN "style_configs"."description"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_configs"."description" IS 'Detailed description of the style';


--
-- Name: COLUMN "style_configs"."preview_images"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_configs"."preview_images" IS 'JSON array of preview image URLs';


--
-- Name: COLUMN "style_configs"."available_genders"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_configs"."available_genders" IS 'Array of supported gender options';


--
-- Name: COLUMN "style_configs"."available_backgrounds"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_configs"."available_backgrounds" IS 'Array of available background options';


--
-- Name: COLUMN "style_configs"."available_clothing"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_configs"."available_clothing" IS 'Array of available clothing options';


--
-- Name: COLUMN "style_configs"."available_clothing_colors"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_configs"."available_clothing_colors" IS 'Array of available clothing color options';


--
-- Name: COLUMN "style_configs"."translations"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_configs"."translations" IS 'JSON object containing localized strings for name, tagline, and description keyed by language code';


--
-- Name: COLUMN "style_configs"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_configs"."created_at" IS 'Timestamp when the config was created';


--
-- Name: COLUMN "style_configs"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_configs"."updated_at" IS 'Timestamp when the config was last updated';


--
-- Name: style_options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."style_options" (
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

--
-- Name: TABLE "style_options"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."style_options" IS 'Stores available options for different style categories';


--
-- Name: COLUMN "style_options"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_options"."id" IS 'Unique identifier for the style option';


--
-- Name: COLUMN "style_options"."category"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_options"."category" IS 'Category of the style option (e.g., background, clothing)';


--
-- Name: COLUMN "style_options"."label"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_options"."label" IS 'Display label for the option';


--
-- Name: COLUMN "style_options"."description"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_options"."description" IS 'Detailed description of the option';


--
-- Name: COLUMN "style_options"."options"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_options"."options" IS 'JSON array of specific options within this category';


--
-- Name: COLUMN "style_options"."translations"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_options"."translations" IS 'JSON object containing localized strings for label and description keyed by language code';


--
-- Name: COLUMN "style_options"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_options"."created_at" IS 'Timestamp when the option was created';


--
-- Name: COLUMN "style_options"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."style_options"."updated_at" IS 'Timestamp when the option was last updated';


--
-- Name: styles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."styles" (
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

--
-- Name: TABLE "styles"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."styles" IS 'Stores user-created headshot style configurations';


--
-- Name: COLUMN "styles"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."styles"."id" IS 'Unique identifier for the style';


--
-- Name: COLUMN "styles"."user_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."styles"."user_id" IS 'Reference to the user who created the style';


--
-- Name: COLUMN "styles"."name"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."styles"."name" IS 'Name of the style';


--
-- Name: COLUMN "styles"."settings"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."styles"."settings" IS 'JSON configuration for the style settings';


--
-- Name: COLUMN "styles"."status"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."styles"."status" IS 'Current status of the style (draft, active, etc.)';


--
-- Name: COLUMN "styles"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."styles"."created_at" IS 'Timestamp when the style was created';


--
-- Name: COLUMN "styles"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."styles"."updated_at" IS 'Timestamp when the style was last updated';


--
-- Name: user_language_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."user_language_preferences" (
    "user_id" "uuid" NOT NULL,
    "preferred_language" character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_language_preferences" OWNER TO "postgres";

--
-- Name: user_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."user_progress" (
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

--
-- Name: TABLE "user_progress"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."user_progress" IS 'Tracks user progress through the headshot generation workflow';


--
-- Name: COLUMN "user_progress"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."user_progress"."id" IS 'Unique identifier for the progress entry';


--
-- Name: COLUMN "user_progress"."user_id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."user_progress"."user_id" IS 'Reference to the user';


--
-- Name: COLUMN "user_progress"."current_stage"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."user_progress"."current_stage" IS 'Current stage in the workflow';


--
-- Name: COLUMN "user_progress"."completed_stages"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."user_progress"."completed_stages" IS 'Array of completed workflow stages';


--
-- Name: COLUMN "user_progress"."stage_data"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."user_progress"."stage_data" IS 'JSON data specific to the current stage';


--
-- Name: COLUMN "user_progress"."last_active_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."user_progress"."last_active_at" IS 'Timestamp of user''s last activity';


--
-- Name: COLUMN "user_progress"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."user_progress"."created_at" IS 'Timestamp when the progress tracking started';


--
-- Name: COLUMN "user_progress"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."user_progress"."updated_at" IS 'Timestamp when the progress was last updated';


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "gender" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."users" OWNER TO "postgres";

--
-- Name: TABLE "users"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."users" IS 'Stores user profile information and authentication details';


--
-- Name: COLUMN "users"."id"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."users"."id" IS 'Primary key, references auth.users';


--
-- Name: COLUMN "users"."email"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."users"."email" IS 'User''s email address';


--
-- Name: COLUMN "users"."full_name"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."users"."full_name" IS 'User''s full name';


--
-- Name: COLUMN "users"."avatar_url"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."users"."avatar_url" IS 'URL to user''s profile picture';


--
-- Name: COLUMN "users"."gender"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."users"."gender" IS 'User''s gender preference for headshot generation';


--
-- Name: COLUMN "users"."created_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."users"."created_at" IS 'Timestamp when the user profile was created';


--
-- Name: COLUMN "users"."updated_at"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."users"."updated_at" IS 'Timestamp when the user profile was last updated';


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE "realtime"."messages" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
)
PARTITION BY RANGE ("inserted_at");


ALTER TABLE "realtime"."messages" OWNER TO "supabase_realtime_admin";

--
-- Name: messages_2025_05_02; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE "realtime"."messages_2025_05_02" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2025_05_02" OWNER TO "supabase_admin";

--
-- Name: messages_2025_05_03; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE "realtime"."messages_2025_05_03" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2025_05_03" OWNER TO "supabase_admin";

--
-- Name: messages_2025_05_04; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE "realtime"."messages_2025_05_04" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2025_05_04" OWNER TO "supabase_admin";

--
-- Name: messages_2025_05_05; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE "realtime"."messages_2025_05_05" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2025_05_05" OWNER TO "supabase_admin";

--
-- Name: messages_2025_05_06; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE "realtime"."messages_2025_05_06" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2025_05_06" OWNER TO "supabase_admin";

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE "realtime"."schema_migrations" (
    "version" bigint NOT NULL,
    "inserted_at" timestamp(0) without time zone
);


ALTER TABLE "realtime"."schema_migrations" OWNER TO "supabase_admin";

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE "realtime"."subscription" (
    "id" bigint NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "entity" "regclass" NOT NULL,
    "filters" "realtime"."user_defined_filter"[] DEFAULT '{}'::"realtime"."user_defined_filter"[] NOT NULL,
    "claims" "jsonb" NOT NULL,
    "claims_role" "regrole" GENERATED ALWAYS AS ("realtime"."to_regrole"(("claims" ->> 'role'::"text"))) STORED NOT NULL,
    "created_at" timestamp without time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "realtime"."subscription" OWNER TO "supabase_admin";

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE "realtime"."subscription" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "realtime"."subscription_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE "storage"."buckets" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "public" boolean DEFAULT false,
    "avif_autodetection" boolean DEFAULT false,
    "file_size_limit" bigint,
    "allowed_mime_types" "text"[],
    "owner_id" "text"
);


ALTER TABLE "storage"."buckets" OWNER TO "supabase_storage_admin";

--
-- Name: COLUMN "buckets"."owner"; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN "storage"."buckets"."owner" IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE "storage"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "storage"."migrations" OWNER TO "supabase_storage_admin";

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE "storage"."objects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "text",
    "name" "text",
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "path_tokens" "text"[] GENERATED ALWAYS AS ("string_to_array"("name", '/'::"text")) STORED,
    "version" "text",
    "owner_id" "text",
    "user_metadata" "jsonb"
);


ALTER TABLE "storage"."objects" OWNER TO "supabase_storage_admin";

--
-- Name: COLUMN "objects"."owner"; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN "storage"."objects"."owner" IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE "storage"."s3_multipart_uploads" (
    "id" "text" NOT NULL,
    "in_progress_size" bigint DEFAULT 0 NOT NULL,
    "upload_signature" "text" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "version" "text" NOT NULL,
    "owner_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_metadata" "jsonb"
);


ALTER TABLE "storage"."s3_multipart_uploads" OWNER TO "supabase_storage_admin";

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE "storage"."s3_multipart_uploads_parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "upload_id" "text" NOT NULL,
    "size" bigint DEFAULT 0 NOT NULL,
    "part_number" integer NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "etag" "text" NOT NULL,
    "owner_id" "text",
    "version" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."s3_multipart_uploads_parts" OWNER TO "supabase_storage_admin";

--
-- Name: hooks; Type: TABLE; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE TABLE "supabase_functions"."hooks" (
    "id" bigint NOT NULL,
    "hook_table_id" integer NOT NULL,
    "hook_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "request_id" bigint
);


ALTER TABLE "supabase_functions"."hooks" OWNER TO "supabase_functions_admin";

--
-- Name: TABLE "hooks"; Type: COMMENT; Schema: supabase_functions; Owner: supabase_functions_admin
--

COMMENT ON TABLE "supabase_functions"."hooks" IS 'Supabase Functions Hooks: Audit trail for triggered hooks.';


--
-- Name: hooks_id_seq; Type: SEQUENCE; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE SEQUENCE "supabase_functions"."hooks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "supabase_functions"."hooks_id_seq" OWNER TO "supabase_functions_admin";

--
-- Name: hooks_id_seq; Type: SEQUENCE OWNED BY; Schema: supabase_functions; Owner: supabase_functions_admin
--

ALTER SEQUENCE "supabase_functions"."hooks_id_seq" OWNED BY "supabase_functions"."hooks"."id";


--
-- Name: migrations; Type: TABLE; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE TABLE "supabase_functions"."migrations" (
    "version" "text" NOT NULL,
    "inserted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "supabase_functions"."migrations" OWNER TO "supabase_functions_admin";

--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: postgres
--

CREATE TABLE "supabase_migrations"."schema_migrations" (
    "version" "text" NOT NULL,
    "statements" "text"[],
    "name" "text"
);


ALTER TABLE "supabase_migrations"."schema_migrations" OWNER TO "postgres";

--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: postgres
--

CREATE TABLE "supabase_migrations"."seed_files" (
    "path" "text" NOT NULL,
    "hash" "text" NOT NULL
);


ALTER TABLE "supabase_migrations"."seed_files" OWNER TO "postgres";

--
-- Name: messages_2025_05_02; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_05_02" FOR VALUES FROM ('2025-05-02 00:00:00') TO ('2025-05-03 00:00:00');


--
-- Name: messages_2025_05_03; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_05_03" FOR VALUES FROM ('2025-05-03 00:00:00') TO ('2025-05-04 00:00:00');


--
-- Name: messages_2025_05_04; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_05_04" FOR VALUES FROM ('2025-05-04 00:00:00') TO ('2025-05-05 00:00:00');


--
-- Name: messages_2025_05_05; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_05_05" FOR VALUES FROM ('2025-05-05 00:00:00') TO ('2025-05-06 00:00:00');


--
-- Name: messages_2025_05_06; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_05_06" FOR VALUES FROM ('2025-05-06 00:00:00') TO ('2025-05-07 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."refresh_tokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"auth"."refresh_tokens_id_seq"'::"regclass");


--
-- Name: hooks id; Type: DEFAULT; Schema: supabase_functions; Owner: supabase_functions_admin
--

ALTER TABLE ONLY "supabase_functions"."hooks" ALTER COLUMN "id" SET DEFAULT "nextval"('"supabase_functions"."hooks_id_seq"'::"regclass");


--
-- Data for Name: extensions; Type: TABLE DATA; Schema: _realtime; Owner: supabase_admin
--

COPY "_realtime"."extensions" ("id", "type", "settings", "tenant_external_id", "inserted_at", "updated_at") FROM stdin;
8653f6ac-c541-4d86-b59c-9d679607c3c0	postgres_cdc_rls	{"region": "us-east-1", "db_host": "TQ2j/DAwe0SguG0wTBxTY1GdP/THOquqNXwhpdaTwkY=", "db_name": "sWBpZNdjggEPTQVlI52Zfw==", "db_port": "+enMDFi1J/3IrrquHHwUmA==", "db_user": "uxbEq/zz8DXVD53TOI1zmw==", "slot_name": "supabase_realtime_replication_slot", "db_password": "sWBpZNdjggEPTQVlI52Zfw==", "publication": "supabase_realtime", "ssl_enforced": false, "poll_interval_ms": 100, "poll_max_changes": 100, "poll_max_record_bytes": 1048576}	realtime-dev	2025-05-03 23:36:56	2025-05-03 23:36:56
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: _realtime; Owner: supabase_admin
--

COPY "_realtime"."schema_migrations" ("version", "inserted_at") FROM stdin;
20210706140551	2025-05-03 23:36:52
20220329161857	2025-05-03 23:36:52
20220410212326	2025-05-03 23:36:52
20220506102948	2025-05-03 23:36:52
20220527210857	2025-05-03 23:36:52
20220815211129	2025-05-03 23:36:52
20220815215024	2025-05-03 23:36:52
20220818141501	2025-05-03 23:36:52
20221018173709	2025-05-03 23:36:52
20221102172703	2025-05-03 23:36:52
20221223010058	2025-05-03 23:36:52
20230110180046	2025-05-03 23:36:52
20230810220907	2025-05-03 23:36:52
20230810220924	2025-05-03 23:36:52
20231024094642	2025-05-03 23:36:52
20240306114423	2025-05-03 23:36:52
20240418082835	2025-05-03 23:36:52
20240625211759	2025-05-03 23:36:52
20240704172020	2025-05-03 23:36:52
20240902173232	2025-05-03 23:36:52
20241106103258	2025-05-03 23:36:52
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: _realtime; Owner: supabase_admin
--

COPY "_realtime"."tenants" ("id", "name", "external_id", "jwt_secret", "max_concurrent_users", "inserted_at", "updated_at", "max_events_per_second", "postgres_cdc_default", "max_bytes_per_second", "max_channels_per_client", "max_joins_per_second", "suspend", "jwt_jwks", "notify_private_alpha", "private_only") FROM stdin;
d0d684ab-f02e-4fd0-91f2-eb7f0737dfa0	realtime-dev	realtime-dev	iNjicxc4+llvc9wovDvqymwfnj9teWMlyOIbJ8Fh6j2WNU8CIJ2ZgjR6MUIKqSmeDmvpsKLsZ9jgXJmQPpwL8w==	200	2025-05-03 23:36:56	2025-05-03 23:36:56	100	postgres_cdc_rls	100000	100	100	f	{"keys": [{"k": "c3VwZXItc2VjcmV0LWp3dC10b2tlbi13aXRoLWF0LWxlYXN0LTMyLWNoYXJhY3RlcnMtbG9uZw", "kty": "oct"}]}	f	f
\.


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at") FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."schema_migrations" ("version") FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
\.


--
-- Data for Name: completed_user_journeys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."completed_user_journeys" ("id", "user_id", "journey_data", "completed_at", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."images" ("id", "user_id", "url", "created_at", "file_name", "file_size", "mime_type", "dimensions", "order_id") FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."orders" ("id", "user_id", "status", "amount", "currency", "payment_intent_id", "payment_status", "metadata", "created_at", "updated_at", "idempotency_key", "checkout_session_id") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."sessions" ("id", "user_id", "created_at", "updated_at", "expires_at", "last_accessed_at") FROM stdin;
\.


--
-- Data for Name: style_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."style_configs" ("id", "name", "tagline", "description", "preview_images", "available_genders", "available_backgrounds", "available_clothing", "available_clothing_colors", "translations", "created_at", "updated_at") FROM stdin;
editorial	Editorial	Story-Driven. Stylised. Striking.	A cinematic, magazine-worthy aesthetic. Expressive and fashion-forward — stand out with personality and mood.	["outdoor-fashion-1.webp", "outdoor-fashion-2.webp", "outdoor-fashion-3.webp", "outdoor-fashion-4.webp", "outdoor-fashion-4.webp"]	{male,female}	{plain-light,plain-dark,plain-orange,plain-blue,plain-teal}	{hoodie,shirt,polo,henley,jacket,fishermans-jumper}	{#000000,#FFFFFF,#2A9D47,#3B82F6,#FF7F39,#D22D2D,#FC84E2,#A28DF7,#6B7280,#4F46E5}	{"de": {"name": "Editorial", "tagline": "Erzählerisch. Stilisiert. Eindrucksvoll.", "description": "Eine filmische, magazinwürdige Ästhetik. Expressiv und modisch — stechen Sie mit Persönlichkeit und Stimmung hervor."}, "es": {"name": "Editorial", "tagline": "Narrativo. Estilizado. Impactante.", "description": "Una estética cinematográfica digna de revista. Expresivo y vanguardista — destaca con personalidad y ambiente."}, "fr": {"name": "Éditorial", "tagline": "Narratif. Stylisé. Saisissant.", "description": "Une esthétique cinématographique digne des magazines. Expressif et avant-gardiste — démarquez-vous avec personnalité et ambiance."}, "it": {"name": "Editoriale", "tagline": "Narrativo. Stilizzato. Impressionante.", "description": "Un'estetica cinematografica degna di una rivista. Espressivo e all'avanguardia — distinguiti con personalità e atmosfera."}, "ja": {"name": "エディトリアル", "tagline": "ストーリー性。様式的。印象的。", "description": "映画のような雑誌品質の美学。表現力豊かでファッション性の高い — 個性と雰囲気で際立ちます。"}, "nl": {"name": "Editorial", "tagline": "Verhalend. Gestileerd. Opvallend.", "description": "Een cinematografische, magazine-waardige esthetiek. Expressief en vooruitstrevend — val op met persoonlijkheid en sfeer."}, "pt": {"name": "Editorial", "tagline": "Narrativo. Estilizado. Impactante.", "description": "Uma estética cinematográfica digna de revista. Expressivo e vanguardista — destaque-se com personalidade e atmosfera."}, "zh": {"name": "杂志风格", "tagline": "叙事性。风格化。引人注目。", "description": "电影般的杂志级美学。富有表现力和前卫感 — 以独特个性和氛围脱颖而出。"}}	2025-05-03 23:36:54.119333+00	2025-05-03 23:36:54.119333+00
corporate	Corporate	Professional. Approachable. Trusted.	Professional and approachable, perfect for LinkedIn, team pages, and pitch decks — designed to make a confident first impression.	["business-2.webp", "business-1.webp", "business-3.webp", "business-1.webp", "business-3.webp"]	{male,female}	{plain-light,plain-dark,plain-orange,plain-blue,plain-teal}	{suit-jacket-shirt,shirt,polo,henley,jacket}	{#000000,#FFFFFF,#2A9D47,#3B82F6,#FF7F39,#D22D2D,#FC84E2,#A28DF7,#6B7280,#4F46E5}	{"de": {"name": "Business", "tagline": "Professionell. Zugänglich. Vertrauenswürdig.", "description": "Professionell und zugänglich, perfekt für LinkedIn, Teamseiten und Pitch-Decks — entwickelt für einen selbstbewussten ersten Eindruck."}, "es": {"name": "Corporativo", "tagline": "Profesional. Accesible. Confiable.", "description": "Profesional y accesible, perfecto para LinkedIn, páginas de equipo y presentaciones — diseñado para dar una primera impresión segura."}, "fr": {"name": "Corporate", "tagline": "Professionnel. Accessible. Fiable.", "description": "Professionnel et accessible, parfait pour LinkedIn, les pages d'équipe et les présentations — conçu pour donner une première impression assurée."}, "it": {"name": "Corporate", "tagline": "Professionale. Accessibile. Affidabile.", "description": "Professionale e accessibile, perfetto per LinkedIn, pagine del team e presentazioni — progettato per dare una prima impressione sicura."}, "ja": {"name": "コーポレート", "tagline": "プロフェッショナル。親しみやすい。信頼感。", "description": "プロフェッショナルで親しみやすい、LinkedIn、チームページ、ピッチデッキに最適 — 自信に満ちた第一印象を作るためにデザインされました。"}, "nl": {"name": "Zakelijk", "tagline": "Professioneel. Benaderbaar. Betrouwbaar.", "description": "Professioneel en toegankelijk, perfect voor LinkedIn, teampagina's en pitch decks — ontworpen om een zelfverzekerde eerste indruk te maken."}, "pt": {"name": "Corporativo", "tagline": "Profissional. Acessível. Confiável.", "description": "Profissional e acessível, perfeito para LinkedIn, páginas de equipe e apresentações — projetado para criar uma primeira impressão confiante."}, "zh": {"name": "商务风格", "tagline": "专业。平易近人。值得信赖。", "description": "专业且平易近人，完美适用于领英、团队页面和演示文稿 — 旨在创造自信的第一印象。"}}	2025-05-03 23:36:54.119333+00	2025-05-03 23:36:54.119333+00
studio	Studio	Polished. Professional. Powerful.	Step into the spotlight with Studio style — clean, high-impact headshots perfect for portfolios, castings, and personal branding.	["studio-1.webp", "studio-2.webp", "studio-3.webp", "studio-1.webp", "studio-2.webp"]	{male,female}	{plain-light,plain-dark,plain-orange,plain-blue,plain-teal}	{shirt,polo,henley,jacket,fishermans-jumper}	{#000000,#FFFFFF,#2A9D47,#3B82F6,#FF7F39,#D22D2D,#FC84E2,#A28DF7,#6B7280,#4F46E5}	{"de": {"name": "Studio", "tagline": "Poliert. Professionell. Kraftvoll.", "description": "Treten Sie mit dem Studio-Stil ins Rampenlicht — klare, wirkungsvolle Portraits, perfekt für Portfolios, Castings und persönliches Branding."}, "es": {"name": "Estudio", "tagline": "Refinado. Profesional. Poderoso.", "description": "Paso al centro de la cámara con el estilo Estudio — imágenes de cabecera limpias y de alto impacto perfectas para portafolios, casting y branding personal."}, "fr": {"name": "Studio", "tagline": "Raffiné. Professionnel. Puissant.", "description": "Entrez dans la lumière avec le style Studio — des portraits nets et percutants, parfaits pour les portfolios, les castings et l'image de marque personnelle."}, "it": {"name": "Studio", "tagline": "Raffinato. Professionale. Potente.", "description": "Entra sotto i riflettori con lo stile Studio — ritratti puliti e d'impatto perfetti per portfolio, casting e personal branding."}, "ja": {"name": "スタジオ", "tagline": "洗練。プロフェッショナル。パワフル。", "description": "スタジオスタイルでスポットライトを浴びましょう — ポートフォリオ、キャスティング、パーソナルブランディングに最適なクリーンで印象的なヘッドショット。"}, "nl": {"name": "Studio", "tagline": "Gepolijst. Professioneel. Krachtig.", "description": "Stap in de spotlight met de Studio-stijl — strakke, impactvolle headshots perfect voor portfolio's, castings en personal branding."}, "pt": {"name": "Estúdio", "tagline": "Refinado. Profissional. Poderoso.", "description": "Entre sob os holofotes com o estilo Estúdio — fotos limpas e de alto impacto perfeitas para portfólios, testes e marca pessoal."}, "zh": {"name": "工作室风格", "tagline": "精致。专业。有力。", "description": "以工作室风格步入聚光灯下 — 干净、具有冲击力的头像照片，完美适用于作品集、试镜和个人品牌塑造。"}}	2025-05-03 23:36:54.119333+00	2025-05-03 23:36:54.119333+00
\.


--
-- Data for Name: style_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."style_options" ("id", "category", "label", "description", "options", "translations", "created_at", "updated_at") FROM stdin;
efb652d3-410f-4624-a6b5-fa47964dc44b	background	Background	Pick a background style. The examples give a general feel, actual results may differ slightly.	[{"id": "plain-light", "label": "Studio Light", "imageUrl": "bg-plain-light.webp", "translations": {"de": {"label": "Studio Hell"}, "es": {"label": "Estudio Claro"}, "fr": {"label": "Studio Clair"}, "it": {"label": "Studio Chiaro"}, "ja": {"label": "スタジオライト"}, "nl": {"label": "Studio Licht"}, "pt": {"label": "Estúdio Claro"}, "zh": {"label": "明亮工作室"}}}, {"id": "plain-dark", "label": "Studio Dark", "imageUrl": "bg-plain-dark.webp", "translations": {"de": {"label": "Studio Dunkel"}, "es": {"label": "Estudio Oscuro"}, "fr": {"label": "Studio Sombre"}, "it": {"label": "Studio Scuro"}, "ja": {"label": "スタジオダーク"}, "nl": {"label": "Studio Donker"}, "pt": {"label": "Estúdio Escuro"}, "zh": {"label": "暗调工作室"}}}, {"id": "plain-orange", "label": "Studio Orange", "imageUrl": "bg-plain-orange.webp", "translations": {"de": {"label": "Studio Orange"}, "es": {"label": "Estudio Naranja"}, "fr": {"label": "Studio Orange"}, "it": {"label": "Studio Arancione"}, "ja": {"label": "スタジオオレンジ"}, "nl": {"label": "Studio Oranje"}, "pt": {"label": "Estúdio Laranja"}, "zh": {"label": "橙色工作室"}}}, {"id": "plain-blue", "label": "Studio Blue", "imageUrl": "bg-plain-blue.webp", "translations": {"de": {"label": "Studio Blau"}, "es": {"label": "Estudio Azul"}, "fr": {"label": "Studio Bleu"}, "it": {"label": "Studio Blu"}, "ja": {"label": "スタジオブルー"}, "nl": {"label": "Studio Blauw"}, "pt": {"label": "Estúdio Azul"}, "zh": {"label": "蓝色工作室"}}}, {"id": "plain-teal", "label": "Studio Teal", "imageUrl": "bg-plain-teal.webp", "translations": {"de": {"label": "Studio Türkis"}, "es": {"label": "Estudio Verde"}, "fr": {"label": "Studio Turquoise"}, "it": {"label": "Studio Turchese"}, "ja": {"label": "スタジオティール"}, "nl": {"label": "Studio Groenblauw"}, "pt": {"label": "Estúdio Verde-água"}, "zh": {"label": "青色工作室"}}}]	{"de": {"label": "Hintergrund", "description": "Wählen Sie den Hintergrundstil für Ihr Foto"}, "es": {"label": "Fondo", "description": "Elige el estilo del fondo de tu foto"}, "fr": {"label": "Arrière-plan", "description": "Choisissez le style d'arrière-plan de votre photo"}, "it": {"label": "Sfondo", "description": "Scegli lo stile dello sfondo della tua foto"}, "ja": {"label": "背景", "description": "写真の背景スタイルを選択してください"}, "nl": {"label": "Achtergrond", "description": "Kies de achtergrondstijl voor uw foto"}, "pt": {"label": "Fundo", "description": "Escolha o estilo do fundo da sua foto"}, "zh": {"label": "背景", "description": "选择您照片的背景风格"}}	2025-05-03 23:36:54.119333+00	2025-05-03 23:36:54.119333+00
948e161e-c341-4d5f-976b-c62c032a2573	clothing	Clothing Type	Choose a clothing style for your headshot. The samples are representative, but the final look may vary.	[{"id": "hoodie", "label": "Hoodie", "imageUrl": "hoodie.webp", "translations": {"de": {"label": "Kapuzenpullover"}, "es": {"label": "Sudadera con Capucha"}, "fr": {"label": "Sweat à Capuche"}, "it": {"label": "Felpa con Cappuccio"}, "ja": {"label": "パーカー"}, "nl": {"label": "Hoodie"}, "pt": {"label": "Moletom com Capuz"}, "zh": {"label": "连帽衫"}}}, {"id": "suit-jacket-shirt", "label": "Suit Jacket/Shirt", "imageUrl": "blazer-shirt.webp", "translations": {"de": {"label": "Anzugjacke/Hemd"}, "es": {"label": "Chaqueta de Traje/Camisa"}, "fr": {"label": "Veste de Costume/Chemise"}, "it": {"label": "Giacca/Camicia"}, "ja": {"label": "スーツジャケット/シャツ"}, "nl": {"label": "Colbert/Overhemd"}, "pt": {"label": "Paletó/Camisa"}, "zh": {"label": "西装外套/衬衫"}}}, {"id": "shirt", "label": "Shirt", "imageUrl": "shirt.webp", "translations": {"de": {"label": "Hemd"}, "es": {"label": "Camisa"}, "fr": {"label": "Chemise"}, "it": {"label": "Camicia"}, "ja": {"label": "シャツ"}, "nl": {"label": "Overhemd"}, "pt": {"label": "Camisa"}, "zh": {"label": "衬衫"}}}, {"id": "polo", "label": "Polo", "imageUrl": "polo.webp", "translations": {"de": {"label": "Poloshirt"}, "es": {"label": "Polo"}, "fr": {"label": "Polo"}, "it": {"label": "Polo"}, "ja": {"label": "ポロシャツ"}, "nl": {"label": "Polo"}, "pt": {"label": "Polo"}, "zh": {"label": "polo衫"}}}, {"id": "henley", "label": "Henley", "imageUrl": "henley.webp", "translations": {"de": {"label": "Henley"}, "es": {"label": "Henley"}, "fr": {"label": "Henley"}, "it": {"label": "Henley"}, "ja": {"label": "ヘンリーネック"}, "nl": {"label": "Henley"}, "pt": {"label": "Henley"}, "zh": {"label": "亨利领"}}}, {"id": "jacket", "label": "Jacket", "imageUrl": "jacket.webp", "translations": {"de": {"label": "Jacke"}, "es": {"label": "Chaqueta"}, "fr": {"label": "Veste"}, "it": {"label": "Giacca"}, "ja": {"label": "ジャケット"}, "nl": {"label": "Jas"}, "pt": {"label": "Jaqueta"}, "zh": {"label": "夹克"}}}, {"id": "fishermans-jumper", "label": "Fishermans Jumper", "imageUrl": "fishermans-jumper.webp", "translations": {"de": {"label": "Fischerpullover"}, "es": {"label": "Suéter de Pescador"}, "fr": {"label": "Pull Marin"}, "it": {"label": "Maglione da Pescatore"}, "ja": {"label": "フィッシャーマンセーター"}, "nl": {"label": "Visserstrui"}, "pt": {"label": "Suéter de Pescador"}, "zh": {"label": "渔夫毛衣"}}}]	{"de": {"label": "Kleidungsart", "description": "Wählen Sie Ihren bevorzugten Kleidungsstil"}, "es": {"label": "Tipo de Vestuario", "description": "Selecciona tu estilo de vestuario preferido"}, "fr": {"label": "Type de Vêtement", "description": "Choisissez votre style vestimentaire préféré"}, "it": {"label": "Tipo di Abbigliamento", "description": "Scegli il tuo stile di abbigliamento preferito"}, "ja": {"label": "衣類の種類", "description": "お好みの服装スタイルを選択してください"}, "nl": {"label": "Type Kleding", "description": "Kies uw gewenste kledingstijl"}, "pt": {"label": "Tipo de Roupa", "description": "Selecione seu estilo de roupa preferido"}, "zh": {"label": "服装类型", "description": "选择您喜欢的服装风格"}}	2025-05-03 23:36:54.119333+00	2025-05-03 23:36:54.119333+00
c7ef0eb1-11f8-400f-bf7e-3fbbf4f18cb4	clothingColor	Clothing Color	Select a clothing colour you prefer. The shade shown is a guide, results may have subtle differences.	[{"id": "#000000", "label": "Black", "translations": {"de": {"label": "Schwarz"}, "es": {"label": "Negro"}, "fr": {"label": "Noir"}, "it": {"label": "Nero"}, "ja": {"label": "黒"}, "nl": {"label": "Zwart"}, "pt": {"label": "Preto"}, "zh": {"label": "黑色"}}}, {"id": "#FFFFFF", "label": "White", "translations": {"de": {"label": "Weiß"}, "es": {"label": "Blanco"}, "fr": {"label": "Blanc"}, "it": {"label": "Bianco"}, "ja": {"label": "白"}, "nl": {"label": "Wit"}, "pt": {"label": "Branco"}, "zh": {"label": "白色"}}}, {"id": "#2A9D47", "label": "Green", "translations": {"de": {"label": "Grün"}, "es": {"label": "Verde"}, "fr": {"label": "Vert"}, "it": {"label": "Verde"}, "ja": {"label": "緑"}, "nl": {"label": "Groen"}, "pt": {"label": "Verde"}, "zh": {"label": "绿色"}}}, {"id": "#3B82F6", "label": "Blue", "translations": {"de": {"label": "Blau"}, "es": {"label": "Azul"}, "fr": {"label": "Bleu"}, "it": {"label": "Blu"}, "ja": {"label": "青"}, "nl": {"label": "Blauw"}, "pt": {"label": "Azul"}, "zh": {"label": "蓝色"}}}, {"id": "#FF7F39", "label": "Orange", "translations": {"de": {"label": "Orange"}, "es": {"label": "Naranja"}, "fr": {"label": "Orange"}, "it": {"label": "Arancione"}, "ja": {"label": "オレンジ"}, "nl": {"label": "Oranje"}, "pt": {"label": "Laranja"}, "zh": {"label": "橙色"}}}, {"id": "#D22D2D", "label": "Red", "translations": {"de": {"label": "Rot"}, "es": {"label": "Rojo"}, "fr": {"label": "Rouge"}, "it": {"label": "Rosso"}, "ja": {"label": "赤"}, "nl": {"label": "Rood"}, "pt": {"label": "Vermelho"}, "zh": {"label": "红色"}}}, {"id": "#FC84E2", "label": "Pink", "translations": {"de": {"label": "Pink"}, "es": {"label": "Rosa"}, "fr": {"label": "Rose"}, "it": {"label": "Rosa"}, "ja": {"label": "ピンク"}, "nl": {"label": "Roze"}, "pt": {"label": "Rosa"}, "zh": {"label": "粉色"}}}, {"id": "#A28DF7", "label": "Purple", "translations": {"de": {"label": "Lila"}, "es": {"label": "Morado"}, "fr": {"label": "Violet"}, "it": {"label": "Viola"}, "ja": {"label": "紫"}, "nl": {"label": "Paars"}, "pt": {"label": "Roxo"}, "zh": {"label": "紫色"}}}, {"id": "#6B7280", "label": "Gray", "translations": {"de": {"label": "Grau"}, "es": {"label": "Gris"}, "fr": {"label": "Gris"}, "it": {"label": "Grigio"}, "ja": {"label": "グレー"}, "nl": {"label": "Grijs"}, "pt": {"label": "Cinza"}, "zh": {"label": "灰色"}}}, {"id": "#4F46E5", "label": "Indigo", "translations": {"de": {"label": "Indigo"}, "es": {"label": "Índigo"}, "fr": {"label": "Indigo"}, "it": {"label": "Indaco"}, "ja": {"label": "インディゴ"}, "nl": {"label": "Indigo"}, "pt": {"label": "Índigo"}, "zh": {"label": "靛蓝"}}}]	{"de": {"label": "Kleidungsfarbe", "description": "Wählen Sie Ihre bevorzugte Kleidungsfarbe"}, "es": {"label": "Color de Vestuario", "description": "Selecciona tu color de vestuario preferido"}, "fr": {"label": "Couleur du Vêtement", "description": "Sélectionnez la couleur de vêtement que vous préférez"}, "it": {"label": "Colore dell'Abbigliamento", "description": "Seleziona il colore dell'abbigliamento che preferisci"}, "ja": {"label": "服の色", "description": "お好みの服の色を選択してください"}, "nl": {"label": "Kleding Kleur", "description": "Kies uw gewenste kleding kleur"}, "pt": {"label": "Cor da Roupa", "description": "Selecione a cor da roupa de sua preferência"}, "zh": {"label": "服装颜色", "description": "选择您喜欢的服装颜色"}}	2025-05-03 23:36:54.119333+00	2025-05-03 23:36:54.119333+00
\.


--
-- Data for Name: styles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."styles" ("id", "user_id", "name", "settings", "status", "created_at", "updated_at", "order_id") FROM stdin;
\.


--
-- Data for Name: user_language_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_language_preferences" ("user_id", "preferred_language", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: user_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_progress" ("id", "user_id", "current_stage", "completed_stages", "stage_data", "last_active_at", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."users" ("id", "email", "full_name", "avatar_url", "gender", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: messages_2025_05_02; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY "realtime"."messages_2025_05_02" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: messages_2025_05_03; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY "realtime"."messages_2025_05_03" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: messages_2025_05_04; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY "realtime"."messages_2025_05_04" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: messages_2025_05_05; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY "realtime"."messages_2025_05_05" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: messages_2025_05_06; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY "realtime"."messages_2025_05_06" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY "realtime"."schema_migrations" ("version", "inserted_at") FROM stdin;
20211116024918	2025-05-03 23:36:53
20211116045059	2025-05-03 23:36:53
20211116050929	2025-05-03 23:36:53
20211116051442	2025-05-03 23:36:53
20211116212300	2025-05-03 23:36:53
20211116213355	2025-05-03 23:36:53
20211116213934	2025-05-03 23:36:53
20211116214523	2025-05-03 23:36:53
20211122062447	2025-05-03 23:36:53
20211124070109	2025-05-03 23:36:53
20211202204204	2025-05-03 23:36:53
20211202204605	2025-05-03 23:36:53
20211210212804	2025-05-03 23:36:53
20211228014915	2025-05-03 23:36:53
20220107221237	2025-05-03 23:36:53
20220228202821	2025-05-03 23:36:53
20220312004840	2025-05-03 23:36:53
20220603231003	2025-05-03 23:36:53
20220603232444	2025-05-03 23:36:53
20220615214548	2025-05-03 23:36:53
20220712093339	2025-05-03 23:36:53
20220908172859	2025-05-03 23:36:53
20220916233421	2025-05-03 23:36:53
20230119133233	2025-05-03 23:36:53
20230128025114	2025-05-03 23:36:53
20230128025212	2025-05-03 23:36:53
20230227211149	2025-05-03 23:36:53
20230228184745	2025-05-03 23:36:53
20230308225145	2025-05-03 23:36:53
20230328144023	2025-05-03 23:36:53
20231018144023	2025-05-03 23:36:53
20231204144023	2025-05-03 23:36:53
20231204144024	2025-05-03 23:36:53
20231204144025	2025-05-03 23:36:53
20240108234812	2025-05-03 23:36:53
20240109165339	2025-05-03 23:36:53
20240227174441	2025-05-03 23:36:53
20240311171622	2025-05-03 23:36:53
20240321100241	2025-05-03 23:36:53
20240401105812	2025-05-03 23:36:53
20240418121054	2025-05-03 23:36:53
20240523004032	2025-05-03 23:36:53
20240618124746	2025-05-03 23:36:53
20240801235015	2025-05-03 23:36:53
20240805133720	2025-05-03 23:36:53
20240827160934	2025-05-03 23:36:53
20240919163303	2025-05-03 23:36:53
20240919163305	2025-05-03 23:36:53
20241019105805	2025-05-03 23:36:53
20241030150047	2025-05-03 23:36:53
20241108114728	2025-05-03 23:36:53
20241121104152	2025-05-03 23:36:53
20241130184212	2025-05-03 23:36:53
20241220035512	2025-05-03 23:36:53
20241220123912	2025-05-03 23:36:53
20241224161212	2025-05-03 23:36:53
20250107150512	2025-05-03 23:36:53
20250110162412	2025-05-03 23:36:53
20250123174212	2025-05-03 23:36:53
20250128220012	2025-05-03 23:36:53
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY "realtime"."subscription" ("id", "subscription_id", "entity", "filters", "claims", "created_at") FROM stdin;
1	81d7a66e-2877-11f0-8640-fa19461872f3	"public"."styles"	{}	{"aal": "aal1", "amr": [{"method": "oauth", "timestamp": 1746311647}], "aud": "authenticated", "exp": 1746318758, "iat": 1746315158, "iss": "http://127.0.0.1:54321/auth/v1", "sub": "23fb7234-6ef8-4453-b671-33805c2692b6", "role": "authenticated", "email": "david.benollol@gmail.com", "phone": "", "session_id": "3476a152-9500-474e-a4c3-6fea8f17d031", "app_metadata": {"provider": "google", "providers": ["google"]}, "is_anonymous": false, "user_metadata": {"iss": "https://accounts.google.com", "sub": "110530994538012758503", "name": "David", "email": "david.benollol@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJNQhWmftVDfrAYDINBMHf3K5wgtN9bgl-MRtTm5nVS8iMr1aWn=s96-c", "full_name": "David", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJNQhWmftVDfrAYDINBMHf3K5wgtN9bgl-MRtTm5nVS8iMr1aWn=s96-c", "provider_id": "110530994538012758503", "email_verified": true, "phone_verified": false}}	2025-05-03 23:37:01.947381
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id") FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."migrations" ("id", "name", "hash", "executed_at") FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-05-03 23:36:53.629727
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-05-03 23:36:53.630827
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-05-03 23:36:53.631428
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-05-03 23:36:53.634814
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-05-03 23:36:53.642172
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-05-03 23:36:53.643121
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-05-03 23:36:53.644258
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-05-03 23:36:53.645272
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-05-03 23:36:53.645967
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-05-03 23:36:53.646674
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-05-03 23:36:53.647593
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-05-03 23:36:53.648794
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-05-03 23:36:53.649981
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-05-03 23:36:53.650873
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-05-03 23:36:53.651663
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-05-03 23:36:53.657895
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-05-03 23:36:53.658751
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-05-03 23:36:53.65947
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-05-03 23:36:53.660389
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-05-03 23:36:53.661489
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-05-03 23:36:53.662177
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-05-03 23:36:53.663748
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-05-03 23:36:53.670756
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-05-03 23:36:53.67506
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-05-03 23:36:53.675987
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-05-03 23:36:53.676894
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--

COPY "supabase_functions"."hooks" ("id", "hook_table_id", "hook_name", "created_at", "request_id") FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--

COPY "supabase_functions"."migrations" ("version", "inserted_at") FROM stdin;
initial	2025-05-03 23:36:42.47896+00
20210809183423_update_grants	2025-05-03 23:36:42.47896+00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: supabase_migrations; Owner: postgres
--

COPY "supabase_migrations"."schema_migrations" ("version", "statements", "name") FROM stdin;
20240424000000	{"-- Create flow_stage enum type\nCREATE TYPE public.flow_stage AS ENUM ('shoot', 'payment', 'upload', 'review', 'albums')","COMMENT ON TYPE public.flow_stage IS 'Represents the different stages in the headshot generation workflow'","-- Create tables\nCREATE TABLE users (\n  id UUID REFERENCES auth.users PRIMARY KEY,\n  email TEXT,\n  full_name TEXT,\n  avatar_url TEXT,\n  gender TEXT,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())\n)","CREATE TABLE sessions (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  user_id UUID REFERENCES users(id) ON DELETE CASCADE,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),\n  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,\n  last_accessed_at TIMESTAMP WITH TIME ZONE\n)","CREATE TABLE styles (\n  id TEXT PRIMARY KEY,\n  user_id UUID REFERENCES users(id) ON DELETE CASCADE,\n  order_id TEXT,\n  name TEXT NOT NULL,\n  settings JSONB NOT NULL,\n  status TEXT NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())\n)","CREATE TABLE style_configs (\n  id TEXT PRIMARY KEY,\n  name TEXT NOT NULL,\n  tagline TEXT,\n  description TEXT,\n  preview_images JSONB NOT NULL DEFAULT '[]',\n  available_genders TEXT[] NOT NULL DEFAULT '{}',\n  available_backgrounds TEXT[] NOT NULL DEFAULT '{}',\n  available_clothing TEXT[] NOT NULL DEFAULT '{}',\n  available_clothing_colors TEXT[] NOT NULL DEFAULT '{}',\n  translations jsonb DEFAULT '{}'::jsonb NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())\n)","CREATE TABLE style_options (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  category TEXT NOT NULL,\n  label TEXT NOT NULL,\n  description TEXT,\n  options JSONB NOT NULL DEFAULT '[]',\n  translations jsonb DEFAULT '{}'::jsonb NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())\n)","CREATE TABLE orders (\n  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),\n  user_id uuid REFERENCES users(id) ON DELETE CASCADE,\n  status text NOT NULL,\n  amount integer,\n  currency text,\n  payment_intent_id text,\n  payment_status text,\n  metadata jsonb,\n  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),\n  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),\n  idempotency_key text,\n  checkout_session_id text\n)","CREATE TABLE images (\n  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),\n  user_id uuid REFERENCES users(id) ON DELETE CASCADE,\n  url text NOT NULL,\n  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),\n  file_name text,\n  file_size bigint,\n  mime_type text,\n  dimensions jsonb,\n  order_id uuid REFERENCES orders(id) ON DELETE CASCADE\n)","CREATE TABLE user_progress (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  user_id UUID REFERENCES users(id) ON DELETE CASCADE,\n  current_stage flow_stage NOT NULL,\n  completed_stages flow_stage[] NOT NULL DEFAULT '{}',\n  stage_data JSONB,\n  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),\n  UNIQUE(user_id)\n)","CREATE TABLE completed_user_journeys (\n  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n  user_id UUID REFERENCES users(id) ON DELETE CASCADE,\n  journey_data JSONB NOT NULL,\n  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())\n)","-- Create user creation trigger\nCREATE OR REPLACE FUNCTION public.handle_new_user()\nRETURNS TRIGGER AS $$\nBEGIN\n  RAISE LOG 'Creating new user with id: %, email: %', NEW.id, NEW.email;\n  \n  INSERT INTO public.users (id, email, full_name, avatar_url)\n  VALUES (\n    NEW.id,\n    NEW.email,\n    NEW.raw_user_meta_data->>'full_name',\n    NEW.raw_user_meta_data->>'avatar_url'\n  );\n  \n  RAISE LOG 'User created successfully in public.users';\n  RETURN NEW;\nEXCEPTION WHEN OTHERS THEN\n  RAISE LOG 'Error creating user: %', SQLERRM;\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql SECURITY DEFINER","DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users","CREATE TRIGGER on_auth_user_created\n  AFTER INSERT ON auth.users\n  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()","-- Enable RLS on all tables\nALTER TABLE users ENABLE ROW LEVEL SECURITY","ALTER TABLE sessions ENABLE ROW LEVEL SECURITY","ALTER TABLE styles ENABLE ROW LEVEL SECURITY","ALTER TABLE style_configs ENABLE ROW LEVEL SECURITY","ALTER TABLE style_options ENABLE ROW LEVEL SECURITY","ALTER TABLE orders ENABLE ROW LEVEL SECURITY","ALTER TABLE images ENABLE ROW LEVEL SECURITY","ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY","ALTER TABLE completed_user_journeys ENABLE ROW LEVEL SECURITY","-- Create RLS policies\nCREATE POLICY \\"Users can view their own profile\\"\n  ON users FOR SELECT\n  TO authenticated\n  USING (auth.uid() = id)","CREATE POLICY \\"Users can update their own profile\\"\n  ON users FOR UPDATE\n  TO authenticated\n  USING (auth.uid() = id)","CREATE POLICY \\"Allow insert during signup\\"\n  ON users FOR INSERT\n  TO authenticated, anon\n  WITH CHECK (true)","CREATE POLICY \\"Users can view their own sessions\\"\n  ON sessions FOR SELECT\n  TO authenticated\n  USING (auth.uid() = user_id)","CREATE POLICY \\"Users can delete their own sessions\\"\n  ON sessions FOR DELETE\n  TO authenticated\n  USING (auth.uid() = user_id)","CREATE POLICY \\"Allow public read access to style_configs\\"\n  ON style_configs FOR SELECT\n  TO authenticated, anon\n  USING (true)","CREATE POLICY \\"Allow public read access to style_options\\"\n  ON style_options FOR SELECT\n  TO authenticated, anon\n  USING (true)","CREATE POLICY \\"Users can manage their own styles\\"\n  ON styles FOR ALL\n  TO authenticated\n  USING (auth.uid() = user_id)","CREATE POLICY \\"Users can manage their own orders\\"\n  ON orders FOR ALL\n  TO authenticated\n  USING (auth.uid() = user_id)","CREATE POLICY \\"Users can manage their own images\\"\n  ON images FOR ALL\n  TO authenticated\n  USING (auth.uid() = user_id)","CREATE POLICY \\"Users can manage their own progress\\"\n  ON user_progress FOR ALL\n  TO authenticated\n  USING (auth.uid() = user_id)","CREATE POLICY \\"Users can view their own completed journeys\\"\n  ON completed_user_journeys FOR SELECT\n  TO authenticated\n  USING (auth.uid() = user_id)","-- Create updated_at triggers\nCREATE OR REPLACE FUNCTION update_updated_at_column()\nRETURNS TRIGGER AS $$\nBEGIN\n  NEW.updated_at = TIMEZONE('utc', NOW());\n  RETURN NEW;\nEND;\n$$ language 'plpgsql'","CREATE TRIGGER update_users_updated_at\n  BEFORE UPDATE ON users\n  FOR EACH ROW\n  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_sessions_updated_at\n  BEFORE UPDATE ON sessions\n  FOR EACH ROW\n  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_styles_updated_at\n  BEFORE UPDATE ON styles\n  FOR EACH ROW\n  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_style_configs_updated_at\n  BEFORE UPDATE ON style_configs\n  FOR EACH ROW\n  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_style_options_updated_at\n  BEFORE UPDATE ON style_options\n  FOR EACH ROW\n  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_orders_updated_at\n  BEFORE UPDATE ON orders\n  FOR EACH ROW\n  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_images_updated_at\n  BEFORE UPDATE ON images\n  FOR EACH ROW\n  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_user_progress_updated_at\n  BEFORE UPDATE ON user_progress\n  FOR EACH ROW\n  EXECUTE FUNCTION update_updated_at_column()","CREATE TRIGGER update_completed_user_journeys_updated_at\n  BEFORE UPDATE ON completed_user_journeys\n  FOR EACH ROW\n  EXECUTE FUNCTION update_updated_at_column()","-- Add descriptions to all tables and their columns\n\n-- Users table\nCOMMENT ON TABLE users IS 'Stores user profile information and authentication details'","COMMENT ON COLUMN users.id IS 'Primary key, references auth.users'","COMMENT ON COLUMN users.email IS 'User''s email address'","COMMENT ON COLUMN users.full_name IS 'User''s full name'","COMMENT ON COLUMN users.avatar_url IS 'URL to user''s profile picture'","COMMENT ON COLUMN users.gender IS 'User''s gender preference for headshot generation'","COMMENT ON COLUMN users.created_at IS 'Timestamp when the user profile was created'","COMMENT ON COLUMN users.updated_at IS 'Timestamp when the user profile was last updated'","-- Sessions table\nCOMMENT ON TABLE sessions IS 'Stores user session information for authentication'","COMMENT ON COLUMN sessions.id IS 'Unique identifier for the session'","COMMENT ON COLUMN sessions.user_id IS 'Reference to the user who owns this session'","COMMENT ON COLUMN sessions.created_at IS 'Timestamp when the session was created'","COMMENT ON COLUMN sessions.updated_at IS 'Timestamp when the session was last updated'","COMMENT ON COLUMN sessions.expires_at IS 'Timestamp when the session expires'","COMMENT ON COLUMN sessions.last_accessed_at IS 'Timestamp when the session was last accessed'","-- Styles table\nCOMMENT ON TABLE styles IS 'Stores user-created headshot style configurations'","COMMENT ON COLUMN styles.id IS 'Unique identifier for the style'","COMMENT ON COLUMN styles.user_id IS 'Reference to the user who created the style'","COMMENT ON COLUMN styles.order_id IS 'Reference to the order this style is associated with'","COMMENT ON COLUMN styles.name IS 'Name of the style'","COMMENT ON COLUMN styles.settings IS 'JSON configuration for the style settings'","COMMENT ON COLUMN styles.status IS 'Current status of the style (draft, active, etc.)'","COMMENT ON COLUMN styles.created_at IS 'Timestamp when the style was created'","COMMENT ON COLUMN styles.updated_at IS 'Timestamp when the style was last updated'","-- Style configs table\nCOMMENT ON TABLE style_configs IS 'Stores predefined style configuration templates'","COMMENT ON COLUMN style_configs.id IS 'Unique identifier for the style config'","COMMENT ON COLUMN style_configs.name IS 'Name of the style configuration'","COMMENT ON COLUMN style_configs.tagline IS 'Short description or tagline for the style'","COMMENT ON COLUMN style_configs.description IS 'Detailed description of the style'","COMMENT ON COLUMN style_configs.preview_images IS 'JSON array of preview image URLs'","COMMENT ON COLUMN style_configs.available_genders IS 'Array of supported gender options'","COMMENT ON COLUMN style_configs.available_backgrounds IS 'Array of available background options'","COMMENT ON COLUMN style_configs.available_clothing IS 'Array of available clothing options'","COMMENT ON COLUMN style_configs.available_clothing_colors IS 'Array of available clothing color options'","COMMENT ON COLUMN style_configs.translations IS 'JSON object containing localized strings for name, tagline, and description keyed by language code'","COMMENT ON COLUMN style_configs.created_at IS 'Timestamp when the config was created'","COMMENT ON COLUMN style_configs.updated_at IS 'Timestamp when the config was last updated'","-- Style options table\nCOMMENT ON TABLE style_options IS 'Stores available options for different style categories'","COMMENT ON COLUMN style_options.id IS 'Unique identifier for the style option'","COMMENT ON COLUMN style_options.category IS 'Category of the style option (e.g., background, clothing)'","COMMENT ON COLUMN style_options.label IS 'Display label for the option'","COMMENT ON COLUMN style_options.description IS 'Detailed description of the option'","COMMENT ON COLUMN style_options.options IS 'JSON array of specific options within this category'","COMMENT ON COLUMN style_options.translations IS 'JSON object containing localized strings for label and description keyed by language code'","COMMENT ON COLUMN style_options.created_at IS 'Timestamp when the option was created'","COMMENT ON COLUMN style_options.updated_at IS 'Timestamp when the option was last updated'","-- User progress table\nCOMMENT ON TABLE user_progress IS 'Tracks user progress through the headshot generation workflow'","COMMENT ON COLUMN user_progress.id IS 'Unique identifier for the progress entry'","COMMENT ON COLUMN user_progress.user_id IS 'Reference to the user'","COMMENT ON COLUMN user_progress.current_stage IS 'Current stage in the workflow'","COMMENT ON COLUMN user_progress.completed_stages IS 'Array of completed workflow stages'","COMMENT ON COLUMN user_progress.stage_data IS 'JSON data specific to the current stage'","COMMENT ON COLUMN user_progress.last_active_at IS 'Timestamp of user''s last activity'","COMMENT ON COLUMN user_progress.created_at IS 'Timestamp when the progress tracking started'","COMMENT ON COLUMN user_progress.updated_at IS 'Timestamp when the progress was last updated'","-- Completed user journeys table\nCOMMENT ON TABLE completed_user_journeys IS 'Archives completed headshot generation workflows'","COMMENT ON COLUMN completed_user_journeys.id IS 'Unique identifier for the completed journey'","COMMENT ON COLUMN completed_user_journeys.user_id IS 'Reference to the user who completed the journey'","COMMENT ON COLUMN completed_user_journeys.journey_data IS 'JSON data containing the complete journey details'","COMMENT ON COLUMN completed_user_journeys.completed_at IS 'Timestamp when the journey was completed'","COMMENT ON COLUMN completed_user_journeys.created_at IS 'Timestamp when the journey record was created'","COMMENT ON COLUMN completed_user_journeys.updated_at IS 'Timestamp when the journey record was last updated'","-- Orders table\nCOMMENT ON TABLE orders IS 'Stores headshot orders and their payment/processing status'","COMMENT ON COLUMN orders.id IS 'Unique identifier for the order'","COMMENT ON COLUMN orders.user_id IS 'Reference to the user who created the order'","COMMENT ON COLUMN orders.status IS 'Current status of the order (draft, pending_payment, paid, processing, completed, cancelled)'","COMMENT ON COLUMN orders.amount IS 'Total amount for the order in smallest currency unit (e.g., cents)'","COMMENT ON COLUMN orders.currency IS 'Three-letter currency code (e.g., USD)'","COMMENT ON COLUMN orders.payment_intent_id IS 'Stripe payment intent ID for tracking payment status'","COMMENT ON COLUMN orders.payment_status IS 'Current status of the payment (pending, succeeded, failed)'","COMMENT ON COLUMN orders.metadata IS 'Additional order metadata stored as JSON'","COMMENT ON COLUMN orders.created_at IS 'Timestamp when the order was created'","COMMENT ON COLUMN orders.updated_at IS 'Timestamp when the order was last updated'","COMMENT ON COLUMN orders.idempotency_key IS 'Stripe idempotency key used for the most recent payment attempt'","COMMENT ON COLUMN orders.checkout_session_id IS 'Stripe checkout session ID for checkout-based payments'","-- Images table\nCOMMENT ON TABLE images IS 'Stores user-uploaded images and their metadata'","COMMENT ON COLUMN images.id IS 'Unique identifier for the image'","COMMENT ON COLUMN images.user_id IS 'Reference to the user who owns the image'","COMMENT ON COLUMN images.url IS 'Public URL where the image can be accessed'","COMMENT ON COLUMN images.created_at IS 'Timestamp when the image was uploaded'","COMMENT ON COLUMN images.file_name IS 'Original filename of the uploaded image'","COMMENT ON COLUMN images.file_size IS 'Size of the image file in bytes'","COMMENT ON COLUMN images.mime_type IS 'MIME type of the image (e.g., image/jpeg)'","COMMENT ON COLUMN images.dimensions IS 'Image dimensions stored as JSON {width: number, height: number}'","COMMENT ON COLUMN images.order_id IS 'Reference to the order this image belongs to'","-- Create function to generate unique style ID\nCREATE OR REPLACE FUNCTION generate_style_id()\nRETURNS TRIGGER AS $$\nBEGIN\n  -- Generate a style ID in format: style_<timestamp>_<random>\n  NEW.id := 'style_' || \n            TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS') || \n            '_' || \n            SUBSTR(MD5(RANDOM()::TEXT), 1, 6);\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql","-- Create trigger for styles table\nCREATE TRIGGER set_style_id\n  BEFORE INSERT ON styles\n  FOR EACH ROW\n  EXECUTE FUNCTION generate_style_id()","-- Add comment for the trigger\nCOMMENT ON FUNCTION generate_style_id IS 'Automatically generates a unique style ID for new styles'"}	initial_schema
20240424143000	{"-- Add UNIQUE constraint to style_options.category\nALTER TABLE style_options\n  ADD CONSTRAINT style_options_category_unique UNIQUE (category)","-- Add comment explaining the constraint\nCOMMENT ON CONSTRAINT style_options_category_unique ON style_options IS \n  'Ensures each category (background, clothing, clothingColor) only appears once in the table to match API assumptions'"}	add_style_options_category_unique_constraint
20240430000000	{"-- Convert order_id in styles table to UUID type\nALTER TABLE styles \n  ALTER COLUMN order_id TYPE uuid USING order_id::uuid","-- Add foreign key constraint if it doesn't exist\nDO $$ \nBEGIN\n  IF NOT EXISTS (\n    SELECT 1 \n    FROM information_schema.table_constraints \n    WHERE constraint_name = 'styles_order_id_fkey'\n  ) THEN\n    ALTER TABLE styles\n      ADD CONSTRAINT styles_order_id_fkey \n      FOREIGN KEY (order_id) \n      REFERENCES orders(id)\n      ON DELETE CASCADE;\n  END IF;\nEND\n$$","-- Add comment explaining the constraint\nCOMMENT ON CONSTRAINT styles_order_id_fkey ON styles IS \n  'Links styles to their associated order, cascade deletes styles when order is deleted'"}	fix_styles_order_id_type
20240430000001	{"-- Temporarily remove the foreign key if it exists\nDO $$ \nBEGIN\n  IF EXISTS (\n    SELECT 1 \n    FROM information_schema.table_constraints \n    WHERE constraint_name = 'styles_order_id_fkey'\n  ) THEN\n    ALTER TABLE styles DROP CONSTRAINT styles_order_id_fkey;\n  END IF;\nEND\n$$","-- Create a temporary column with the new type\nALTER TABLE styles ADD COLUMN order_id_new uuid","-- Update the new column, handling invalid UUIDs\nDO $$\nBEGIN\n  -- Try to convert valid UUIDs\n  UPDATE styles \n  SET order_id_new = order_id::uuid \n  WHERE order_id IS NOT NULL;\nEXCEPTION WHEN OTHERS THEN\n  -- If any conversion fails, we'll handle it in the next step\n  NULL;\nEND\n$$","-- Drop the old column and rename the new one\nALTER TABLE styles DROP COLUMN order_id","ALTER TABLE styles RENAME COLUMN order_id_new TO order_id","-- Add the foreign key constraint\nALTER TABLE styles\n  ADD CONSTRAINT styles_order_id_fkey \n  FOREIGN KEY (order_id) \n  REFERENCES orders(id)\n  ON DELETE CASCADE","-- Add comment explaining the constraint\nCOMMENT ON CONSTRAINT styles_order_id_fkey ON styles IS \n  'Links styles to their associated order, cascade deletes styles when order is deleted'"}	fix_styles_order_id_type_safe
20250428155106	{"-- Create language preferences table\nCREATE TABLE IF NOT EXISTS public.user_language_preferences (\n    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,\n    preferred_language VARCHAR DEFAULT NULL,\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW()\n)","-- Add RLS policies\nALTER TABLE public.user_language_preferences ENABLE ROW LEVEL SECURITY","DROP POLICY IF EXISTS \\"Users can read their own language preference\\" ON public.user_language_preferences","CREATE POLICY \\"Users can read their own language preference\\" ON public.user_language_preferences\n    FOR SELECT\n    USING (auth.uid() = user_id)","DROP POLICY IF EXISTS \\"Users can update their own language preference\\" ON public.user_language_preferences","CREATE POLICY \\"Users can update their own language preference\\" ON public.user_language_preferences\n    FOR UPDATE\n    USING (auth.uid() = user_id)\n    WITH CHECK (auth.uid() = user_id)","DROP POLICY IF EXISTS \\"Users can insert their own language preference\\" ON public.user_language_preferences","CREATE POLICY \\"Users can insert their own language preference\\" ON public.user_language_preferences\n    FOR INSERT\n    WITH CHECK (auth.uid() = user_id)","-- Create function to get language preference\nCREATE OR REPLACE FUNCTION public.get_language_preference()\nRETURNS VARCHAR\nLANGUAGE plpgsql\nSECURITY DEFINER\nSET search_path = public\nAS $$\nDECLARE\n    lang VARCHAR;\nBEGIN\n    SELECT preferred_language INTO lang\n    FROM public.user_language_preferences\n    WHERE user_id = auth.uid();\n    \n    -- Return NULL if no preference is set, allowing i18next to use its default\n    RETURN lang;\nEND;\n$$","-- Create function to update language preference\nCREATE OR REPLACE FUNCTION public.update_language_preference(new_language VARCHAR)\nRETURNS void\nLANGUAGE plpgsql\nSECURITY DEFINER\nSET search_path = public\nAS $$\nBEGIN\n    INSERT INTO public.user_language_preferences (user_id, preferred_language)\n    VALUES (auth.uid(), new_language)\n    ON CONFLICT (user_id) \n    DO UPDATE SET \n        preferred_language = EXCLUDED.preferred_language,\n        updated_at = NOW();\nEND;\n$$","-- Grant execute permissions on functions\nGRANT EXECUTE ON FUNCTION public.get_language_preference TO authenticated","GRANT EXECUTE ON FUNCTION public.update_language_preference TO authenticated","-- Rollback statements (commented out)\n/*\nDROP POLICY IF EXISTS \\"Users can update their own language preference\\" ON auth.users;\nDROP FUNCTION IF EXISTS public.update_language_preference;\nDROP FUNCTION IF EXISTS public.get_language_preference;\nALTER TABLE auth.users DROP COLUMN IF EXISTS preferred_language;\n*/"}	add_language_preference
20250428214535	{"-- Seed style_configs table\nINSERT INTO style_configs (id, name, tagline, description, preview_images, available_genders, available_backgrounds, available_clothing, available_clothing_colors, translations) \nVALUES \n(\n  'editorial',\n  'Editorial',\n  'Story-Driven. Stylised. Striking.',\n  'A cinematic, magazine-worthy aesthetic. Expressive and fashion-forward — stand out with personality and mood.',\n  '[\\"outdoor-fashion-1.webp\\", \\"outdoor-fashion-2.webp\\", \\"outdoor-fashion-3.webp\\", \\"outdoor-fashion-4.webp\\", \\"outdoor-fashion-4.webp\\"]',\n  ARRAY['male', 'female'],\n  ARRAY['plain-light','plain-dark','plain-orange','plain-blue','plain-teal'],\n  ARRAY['hoodie','shirt','polo','henley','jacket','fishermans-jumper'],\n  ARRAY['#000000','#FFFFFF','#2A9D47','#3B82F6','#FF7F39','#D22D2D','#FC84E2','#A28DF7','#6B7280','#4F46E5'],\n  '{\n    \\"es\\": {\n      \\"name\\": \\"Editorial\\",\n      \\"tagline\\": \\"Narrativo. Estilizado. Impactante.\\",\n      \\"description\\": \\"Una estética cinematográfica digna de revista. Expresivo y vanguardista — destaca con personalidad y ambiente.\\"\n    },\n    \\"fr\\": {\n      \\"name\\": \\"Éditorial\\",\n      \\"tagline\\": \\"Narratif. Stylisé. Saisissant.\\",\n      \\"description\\": \\"Une esthétique cinématographique digne des magazines. Expressif et avant-gardiste — démarquez-vous avec personnalité et ambiance.\\"\n    },\n    \\"it\\": {\n      \\"name\\": \\"Editoriale\\",\n      \\"tagline\\": \\"Narrativo. Stilizzato. Impressionante.\\",\n      \\"description\\": \\"Un''estetica cinematografica degna di una rivista. Espressivo e all''avanguardia — distinguiti con personalità e atmosfera.\\"\n    },\n    \\"pt\\": {\n      \\"name\\": \\"Editorial\\",\n      \\"tagline\\": \\"Narrativo. Estilizado. Impactante.\\",\n      \\"description\\": \\"Uma estética cinematográfica digna de revista. Expressivo e vanguardista — destaque-se com personalidade e atmosfera.\\"\n    },\n    \\"de\\": {\n      \\"name\\": \\"Editorial\\",\n      \\"tagline\\": \\"Erzählerisch. Stilisiert. Eindrucksvoll.\\",\n      \\"description\\": \\"Eine filmische, magazinwürdige Ästhetik. Expressiv und modisch — stechen Sie mit Persönlichkeit und Stimmung hervor.\\"\n    },\n    \\"nl\\": {\n      \\"name\\": \\"Editorial\\",\n      \\"tagline\\": \\"Verhalend. Gestileerd. Opvallend.\\",\n      \\"description\\": \\"Een cinematografische, magazine-waardige esthetiek. Expressief en vooruitstrevend — val op met persoonlijkheid en sfeer.\\"\n    },\n    \\"zh\\": {\n      \\"name\\": \\"杂志风格\\",\n      \\"tagline\\": \\"叙事性。风格化。引人注目。\\",\n      \\"description\\": \\"电影般的杂志级美学。富有表现力和前卫感 — 以独特个性和氛围脱颖而出。\\"\n    },\n    \\"ja\\": {\n      \\"name\\": \\"エディトリアル\\",\n      \\"tagline\\": \\"ストーリー性。様式的。印象的。\\",\n      \\"description\\": \\"映画のような雑誌品質の美学。表現力豊かでファッション性の高い — 個性と雰囲気で際立ちます。\\"\n    }\n  }'::jsonb\n),\n(\n  'corporate',\n  'Corporate',\n  'Professional. Approachable. Trusted.',\n  'Professional and approachable, perfect for LinkedIn, team pages, and pitch decks — designed to make a confident first impression.',\n  '[\\"business-2.webp\\", \\"business-1.webp\\", \\"business-3.webp\\", \\"business-1.webp\\", \\"business-3.webp\\"]',\n  ARRAY['male', 'female'],\n  ARRAY['plain-light','plain-dark','plain-orange','plain-blue','plain-teal'],\n  ARRAY['suit-jacket-shirt','shirt','polo','henley','jacket'],\n  ARRAY['#000000','#FFFFFF','#2A9D47','#3B82F6','#FF7F39','#D22D2D','#FC84E2','#A28DF7','#6B7280','#4F46E5'],\n  '{\n    \\"es\\": {\n      \\"name\\": \\"Corporativo\\",\n      \\"tagline\\": \\"Profesional. Accesible. Confiable.\\",\n      \\"description\\": \\"Profesional y accesible, perfecto para LinkedIn, páginas de equipo y presentaciones — diseñado para dar una primera impresión segura.\\"\n    },\n    \\"fr\\": {\n      \\"name\\": \\"Corporate\\",\n      \\"tagline\\": \\"Professionnel. Accessible. Fiable.\\",\n      \\"description\\": \\"Professionnel et accessible, parfait pour LinkedIn, les pages d''équipe et les présentations — conçu pour donner une première impression assurée.\\"\n    },\n    \\"it\\": {\n      \\"name\\": \\"Corporate\\",\n      \\"tagline\\": \\"Professionale. Accessibile. Affidabile.\\",\n      \\"description\\": \\"Professionale e accessibile, perfetto per LinkedIn, pagine del team e presentazioni — progettato per dare una prima impressione sicura.\\"\n    },\n    \\"pt\\": {\n      \\"name\\": \\"Corporativo\\",\n      \\"tagline\\": \\"Profissional. Acessível. Confiável.\\",\n      \\"description\\": \\"Profissional e acessível, perfeito para LinkedIn, páginas de equipe e apresentações — projetado para criar uma primeira impressão confiante.\\"\n    },\n    \\"de\\": {\n      \\"name\\": \\"Business\\",\n      \\"tagline\\": \\"Professionell. Zugänglich. Vertrauenswürdig.\\",\n      \\"description\\": \\"Professionell und zugänglich, perfekt für LinkedIn, Teamseiten und Pitch-Decks — entwickelt für einen selbstbewussten ersten Eindruck.\\"\n    },\n    \\"nl\\": {\n      \\"name\\": \\"Zakelijk\\",\n      \\"tagline\\": \\"Professioneel. Benaderbaar. Betrouwbaar.\\",\n      \\"description\\": \\"Professioneel en toegankelijk, perfect voor LinkedIn, teampagina''s en pitch decks — ontworpen om een zelfverzekerde eerste indruk te maken.\\"\n    },\n    \\"zh\\": {\n      \\"name\\": \\"商务风格\\",\n      \\"tagline\\": \\"专业。平易近人。值得信赖。\\",\n      \\"description\\": \\"专业且平易近人，完美适用于领英、团队页面和演示文稿 — 旨在创造自信的第一印象。\\"\n    },\n    \\"ja\\": {\n      \\"name\\": \\"コーポレート\\",\n      \\"tagline\\": \\"プロフェッショナル。親しみやすい。信頼感。\\",\n      \\"description\\": \\"プロフェッショナルで親しみやすい、LinkedIn、チームページ、ピッチデッキに最適 — 自信に満ちた第一印象を作るためにデザインされました。\\"\n    }\n  }'::jsonb\n),\n(\n  'studio',\n  'Studio',\n  'Polished. Professional. Powerful.',\n  'Step into the spotlight with Studio style — clean, high-impact headshots perfect for portfolios, castings, and personal branding.',\n  '[\\"studio-1.webp\\", \\"studio-2.webp\\", \\"studio-3.webp\\", \\"studio-1.webp\\", \\"studio-2.webp\\"]',\n  ARRAY['male', 'female'],\n  ARRAY['plain-light','plain-dark','plain-orange','plain-blue','plain-teal'],\n  ARRAY['shirt','polo','henley','jacket','fishermans-jumper'],\n  ARRAY['#000000','#FFFFFF','#2A9D47','#3B82F6','#FF7F39','#D22D2D','#FC84E2','#A28DF7','#6B7280','#4F46E5'],\n  '{\n    \\"es\\": {\n      \\"name\\": \\"Estudio\\",\n      \\"tagline\\": \\"Refinado. Profesional. Poderoso.\\",\n      \\"description\\": \\"Paso al centro de la cámara con el estilo Estudio — imágenes de cabecera limpias y de alto impacto perfectas para portafolios, casting y branding personal.\\"\n    },\n    \\"fr\\": {\n      \\"name\\": \\"Studio\\",\n      \\"tagline\\": \\"Raffiné. Professionnel. Puissant.\\",\n      \\"description\\": \\"Entrez dans la lumière avec le style Studio — des portraits nets et percutants, parfaits pour les portfolios, les castings et l''image de marque personnelle.\\"\n    },\n    \\"it\\": {\n      \\"name\\": \\"Studio\\",\n      \\"tagline\\": \\"Raffinato. Professionale. Potente.\\",\n      \\"description\\": \\"Entra sotto i riflettori con lo stile Studio — ritratti puliti e d''impatto perfetti per portfolio, casting e personal branding.\\"\n    },\n    \\"pt\\": {\n      \\"name\\": \\"Estúdio\\",\n      \\"tagline\\": \\"Refinado. Profissional. Poderoso.\\",\n      \\"description\\": \\"Entre sob os holofotes com o estilo Estúdio — fotos limpas e de alto impacto perfeitas para portfólios, testes e marca pessoal.\\"\n    },\n    \\"de\\": {\n      \\"name\\": \\"Studio\\",\n      \\"tagline\\": \\"Poliert. Professionell. Kraftvoll.\\",\n      \\"description\\": \\"Treten Sie mit dem Studio-Stil ins Rampenlicht — klare, wirkungsvolle Portraits, perfekt für Portfolios, Castings und persönliches Branding.\\"\n    },\n    \\"nl\\": {\n      \\"name\\": \\"Studio\\",\n      \\"tagline\\": \\"Gepolijst. Professioneel. Krachtig.\\",\n      \\"description\\": \\"Stap in de spotlight met de Studio-stijl — strakke, impactvolle headshots perfect voor portfolio''s, castings en personal branding.\\"\n    },\n    \\"zh\\": {\n      \\"name\\": \\"工作室风格\\",\n      \\"tagline\\": \\"精致。专业。有力。\\",\n      \\"description\\": \\"以工作室风格步入聚光灯下 — 干净、具有冲击力的头像照片，完美适用于作品集、试镜和个人品牌塑造。\\"\n    },\n    \\"ja\\": {\n      \\"name\\": \\"スタジオ\\",\n      \\"tagline\\": \\"洗練。プロフェッショナル。パワフル。\\",\n      \\"description\\": \\"スタジオスタイルでスポットライトを浴びましょう — ポートフォリオ、キャスティング、パーソナルブランディングに最適なクリーンで印象的なヘッドショット。\\"\n    }\n  }'::jsonb\n)\nON CONFLICT (id) DO UPDATE \nSET \n  name = EXCLUDED.name,\n  tagline = EXCLUDED.tagline,\n  description = EXCLUDED.description,\n  preview_images = EXCLUDED.preview_images,\n  available_genders = EXCLUDED.available_genders,\n  available_backgrounds = EXCLUDED.available_backgrounds,\n  available_clothing = EXCLUDED.available_clothing,\n  available_clothing_colors = EXCLUDED.available_clothing_colors,\n  translations = EXCLUDED.translations","-- Seed style_options table\nINSERT INTO style_options (category, label, description, options, translations) \nVALUES \n(\n  'background',\n  'Background',\n  'Pick a background style. The examples give a general feel, actual results may differ slightly.',\n  '[\n    {\\"id\\": \\"plain-light\\", \\"label\\": \\"Studio Light\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Estudio Claro\\"},\n      \\"fr\\": {\\"label\\": \\"Studio Clair\\"},\n      \\"it\\": {\\"label\\": \\"Studio Chiaro\\"},\n      \\"pt\\": {\\"label\\": \\"Estúdio Claro\\"},\n      \\"de\\": {\\"label\\": \\"Studio Hell\\"},\n      \\"nl\\": {\\"label\\": \\"Studio Licht\\"},\n      \\"zh\\": {\\"label\\": \\"明亮工作室\\"},\n      \\"ja\\": {\\"label\\": \\"スタジオライト\\"}\n    }, \\"imageUrl\\": \\"bg-plain-light.webp\\"}, \n    {\\"id\\": \\"plain-dark\\", \\"label\\": \\"Studio Dark\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Estudio Oscuro\\"},\n      \\"fr\\": {\\"label\\": \\"Studio Sombre\\"},\n      \\"it\\": {\\"label\\": \\"Studio Scuro\\"},\n      \\"pt\\": {\\"label\\": \\"Estúdio Escuro\\"},\n      \\"de\\": {\\"label\\": \\"Studio Dunkel\\"},\n      \\"nl\\": {\\"label\\": \\"Studio Donker\\"},\n      \\"zh\\": {\\"label\\": \\"暗调工作室\\"},\n      \\"ja\\": {\\"label\\": \\"スタジオダーク\\"}\n    }, \\"imageUrl\\": \\"bg-plain-dark.webp\\"}, \n    {\\"id\\": \\"plain-orange\\", \\"label\\": \\"Studio Orange\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Estudio Naranja\\"},\n      \\"fr\\": {\\"label\\": \\"Studio Orange\\"},\n      \\"it\\": {\\"label\\": \\"Studio Arancione\\"},\n      \\"pt\\": {\\"label\\": \\"Estúdio Laranja\\"},\n      \\"de\\": {\\"label\\": \\"Studio Orange\\"},\n      \\"nl\\": {\\"label\\": \\"Studio Oranje\\"},\n      \\"zh\\": {\\"label\\": \\"橙色工作室\\"},\n      \\"ja\\": {\\"label\\": \\"スタジオオレンジ\\"}\n    }, \\"imageUrl\\": \\"bg-plain-orange.webp\\"}, \n    {\\"id\\": \\"plain-blue\\", \\"label\\": \\"Studio Blue\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Estudio Azul\\"},\n      \\"fr\\": {\\"label\\": \\"Studio Bleu\\"},\n      \\"it\\": {\\"label\\": \\"Studio Blu\\"},\n      \\"pt\\": {\\"label\\": \\"Estúdio Azul\\"},\n      \\"de\\": {\\"label\\": \\"Studio Blau\\"},\n      \\"nl\\": {\\"label\\": \\"Studio Blauw\\"},\n      \\"zh\\": {\\"label\\": \\"蓝色工作室\\"},\n      \\"ja\\": {\\"label\\": \\"スタジオブルー\\"}\n    }, \\"imageUrl\\": \\"bg-plain-blue.webp\\"}, \n    {\\"id\\": \\"plain-teal\\", \\"label\\": \\"Studio Teal\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Estudio Verde\\"},\n      \\"fr\\": {\\"label\\": \\"Studio Turquoise\\"},\n      \\"it\\": {\\"label\\": \\"Studio Turchese\\"},\n      \\"pt\\": {\\"label\\": \\"Estúdio Verde-água\\"},\n      \\"de\\": {\\"label\\": \\"Studio Türkis\\"},\n      \\"nl\\": {\\"label\\": \\"Studio Groenblauw\\"},\n      \\"zh\\": {\\"label\\": \\"青色工作室\\"},\n      \\"ja\\": {\\"label\\": \\"スタジオティール\\"}\n    }, \\"imageUrl\\": \\"bg-plain-teal.webp\\"}\n  ]'::jsonb,\n  '{\n    \\"es\\": {\n      \\"label\\": \\"Fondo\\",\n      \\"description\\": \\"Elige el estilo del fondo de tu foto\\"\n    },\n    \\"fr\\": {\n      \\"label\\": \\"Arrière-plan\\",\n      \\"description\\": \\"Choisissez le style d''arrière-plan de votre photo\\"\n    },\n    \\"it\\": {\n      \\"label\\": \\"Sfondo\\",\n      \\"description\\": \\"Scegli lo stile dello sfondo della tua foto\\"\n    },\n    \\"pt\\": {\n      \\"label\\": \\"Fundo\\",\n      \\"description\\": \\"Escolha o estilo do fundo da sua foto\\"\n    },\n    \\"de\\": {\n      \\"label\\": \\"Hintergrund\\",\n      \\"description\\": \\"Wählen Sie den Hintergrundstil für Ihr Foto\\"\n    },\n    \\"nl\\": {\n      \\"label\\": \\"Achtergrond\\",\n      \\"description\\": \\"Kies de achtergrondstijl voor uw foto\\"\n    },\n    \\"zh\\": {\n      \\"label\\": \\"背景\\",\n      \\"description\\": \\"选择您照片的背景风格\\"\n    },\n    \\"ja\\": {\n      \\"label\\": \\"背景\\",\n      \\"description\\": \\"写真の背景スタイルを選択してください\\"\n    }\n  }'::jsonb\n),\n(\n  'clothing',\n  'Clothing Type',\n  'Choose a clothing style for your headshot. The samples are representative, but the final look may vary.',\n  '[\n    {\\"id\\": \\"hoodie\\", \\"label\\": \\"Hoodie\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Sudadera con Capucha\\"},\n      \\"fr\\": {\\"label\\": \\"Sweat à Capuche\\"},\n      \\"it\\": {\\"label\\": \\"Felpa con Cappuccio\\"},\n      \\"pt\\": {\\"label\\": \\"Moletom com Capuz\\"},\n      \\"de\\": {\\"label\\": \\"Kapuzenpullover\\"},\n      \\"nl\\": {\\"label\\": \\"Hoodie\\"},\n      \\"zh\\": {\\"label\\": \\"连帽衫\\"},\n      \\"ja\\": {\\"label\\": \\"パーカー\\"}\n    }, \\"imageUrl\\": \\"hoodie.webp\\"}, \n    {\\"id\\": \\"suit-jacket-shirt\\", \\"label\\": \\"Suit Jacket/Shirt\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Chaqueta de Traje/Camisa\\"},\n      \\"fr\\": {\\"label\\": \\"Veste de Costume/Chemise\\"},\n      \\"it\\": {\\"label\\": \\"Giacca/Camicia\\"},\n      \\"pt\\": {\\"label\\": \\"Paletó/Camisa\\"},\n      \\"de\\": {\\"label\\": \\"Anzugjacke/Hemd\\"},\n      \\"nl\\": {\\"label\\": \\"Colbert/Overhemd\\"},\n      \\"zh\\": {\\"label\\": \\"西装外套/衬衫\\"},\n      \\"ja\\": {\\"label\\": \\"スーツジャケット/シャツ\\"}\n    }, \\"imageUrl\\": \\"blazer-shirt.webp\\"}, \n    {\\"id\\": \\"shirt\\", \\"label\\": \\"Shirt\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Camisa\\"},\n      \\"fr\\": {\\"label\\": \\"Chemise\\"},\n      \\"it\\": {\\"label\\": \\"Camicia\\"},\n      \\"pt\\": {\\"label\\": \\"Camisa\\"},\n      \\"de\\": {\\"label\\": \\"Hemd\\"},\n      \\"nl\\": {\\"label\\": \\"Overhemd\\"},\n      \\"zh\\": {\\"label\\": \\"衬衫\\"},\n      \\"ja\\": {\\"label\\": \\"シャツ\\"}\n    }, \\"imageUrl\\": \\"shirt.webp\\"}, \n    {\\"id\\": \\"polo\\", \\"label\\": \\"Polo\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Polo\\"},\n      \\"fr\\": {\\"label\\": \\"Polo\\"},\n      \\"it\\": {\\"label\\": \\"Polo\\"},\n      \\"pt\\": {\\"label\\": \\"Polo\\"},\n      \\"de\\": {\\"label\\": \\"Poloshirt\\"},\n      \\"nl\\": {\\"label\\": \\"Polo\\"},\n      \\"zh\\": {\\"label\\": \\"polo衫\\"},\n      \\"ja\\": {\\"label\\": \\"ポロシャツ\\"}\n    }, \\"imageUrl\\": \\"polo.webp\\"}, \n    {\\"id\\": \\"henley\\", \\"label\\": \\"Henley\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Henley\\"},\n      \\"fr\\": {\\"label\\": \\"Henley\\"},\n      \\"it\\": {\\"label\\": \\"Henley\\"},\n      \\"pt\\": {\\"label\\": \\"Henley\\"},\n      \\"de\\": {\\"label\\": \\"Henley\\"},\n      \\"nl\\": {\\"label\\": \\"Henley\\"},\n      \\"zh\\": {\\"label\\": \\"亨利领\\"},\n      \\"ja\\": {\\"label\\": \\"ヘンリーネック\\"}\n    }, \\"imageUrl\\": \\"henley.webp\\"}, \n    {\\"id\\": \\"jacket\\", \\"label\\": \\"Jacket\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Chaqueta\\"},\n      \\"fr\\": {\\"label\\": \\"Veste\\"},\n      \\"it\\": {\\"label\\": \\"Giacca\\"},\n      \\"pt\\": {\\"label\\": \\"Jaqueta\\"},\n      \\"de\\": {\\"label\\": \\"Jacke\\"},\n      \\"nl\\": {\\"label\\": \\"Jas\\"},\n      \\"zh\\": {\\"label\\": \\"夹克\\"},\n      \\"ja\\": {\\"label\\": \\"ジャケット\\"}\n    }, \\"imageUrl\\": \\"jacket.webp\\"}, \n    {\\"id\\": \\"fishermans-jumper\\", \\"label\\": \\"Fishermans Jumper\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Suéter de Pescador\\"},\n      \\"fr\\": {\\"label\\": \\"Pull Marin\\"},\n      \\"it\\": {\\"label\\": \\"Maglione da Pescatore\\"},\n      \\"pt\\": {\\"label\\": \\"Suéter de Pescador\\"},\n      \\"de\\": {\\"label\\": \\"Fischerpullover\\"},\n      \\"nl\\": {\\"label\\": \\"Visserstrui\\"},\n      \\"zh\\": {\\"label\\": \\"渔夫毛衣\\"},\n      \\"ja\\": {\\"label\\": \\"フィッシャーマンセーター\\"}\n    }, \\"imageUrl\\": \\"fishermans-jumper.webp\\"}\n  ]'::jsonb,\n  '{\n    \\"es\\": {\n      \\"label\\": \\"Tipo de Vestuario\\",\n      \\"description\\": \\"Selecciona tu estilo de vestuario preferido\\"\n    },\n    \\"fr\\": {\n      \\"label\\": \\"Type de Vêtement\\",\n      \\"description\\": \\"Choisissez votre style vestimentaire préféré\\"\n    },\n    \\"it\\": {\n      \\"label\\": \\"Tipo di Abbigliamento\\",\n      \\"description\\": \\"Scegli il tuo stile di abbigliamento preferito\\"\n    },\n    \\"pt\\": {\n      \\"label\\": \\"Tipo de Roupa\\",\n      \\"description\\": \\"Selecione seu estilo de roupa preferido\\"\n    },\n    \\"de\\": {\n      \\"label\\": \\"Kleidungsart\\",\n      \\"description\\": \\"Wählen Sie Ihren bevorzugten Kleidungsstil\\"\n    },\n    \\"nl\\": {\n      \\"label\\": \\"Type Kleding\\",\n      \\"description\\": \\"Kies uw gewenste kledingstijl\\"\n    },\n    \\"zh\\": {\n      \\"label\\": \\"服装类型\\",\n      \\"description\\": \\"选择您喜欢的服装风格\\"\n    },\n    \\"ja\\": {\n      \\"label\\": \\"衣類の種類\\",\n      \\"description\\": \\"お好みの服装スタイルを選択してください\\"\n    }\n  }'::jsonb\n),\n(\n  'clothingColor',\n  'Clothing Color',\n  'Select a clothing colour you prefer. The shade shown is a guide, results may have subtle differences.',\n  '[\n    {\\"id\\": \\"#000000\\", \\"label\\": \\"Black\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Negro\\"},\n      \\"fr\\": {\\"label\\": \\"Noir\\"},\n      \\"it\\": {\\"label\\": \\"Nero\\"},\n      \\"pt\\": {\\"label\\": \\"Preto\\"},\n      \\"de\\": {\\"label\\": \\"Schwarz\\"},\n      \\"nl\\": {\\"label\\": \\"Zwart\\"},\n      \\"zh\\": {\\"label\\": \\"黑色\\"},\n      \\"ja\\": {\\"label\\": \\"黒\\"}\n    }}, \n    {\\"id\\": \\"#FFFFFF\\", \\"label\\": \\"White\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Blanco\\"},\n      \\"fr\\": {\\"label\\": \\"Blanc\\"},\n      \\"it\\": {\\"label\\": \\"Bianco\\"},\n      \\"pt\\": {\\"label\\": \\"Branco\\"},\n      \\"de\\": {\\"label\\": \\"Weiß\\"},\n      \\"nl\\": {\\"label\\": \\"Wit\\"},\n      \\"zh\\": {\\"label\\": \\"白色\\"},\n      \\"ja\\": {\\"label\\": \\"白\\"}\n    }}, \n    {\\"id\\": \\"#2A9D47\\", \\"label\\": \\"Green\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Verde\\"},\n      \\"fr\\": {\\"label\\": \\"Vert\\"},\n      \\"it\\": {\\"label\\": \\"Verde\\"},\n      \\"pt\\": {\\"label\\": \\"Verde\\"},\n      \\"de\\": {\\"label\\": \\"Grün\\"},\n      \\"nl\\": {\\"label\\": \\"Groen\\"},\n      \\"zh\\": {\\"label\\": \\"绿色\\"},\n      \\"ja\\": {\\"label\\": \\"緑\\"}\n    }}, \n    {\\"id\\": \\"#3B82F6\\", \\"label\\": \\"Blue\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Azul\\"},\n      \\"fr\\": {\\"label\\": \\"Bleu\\"},\n      \\"it\\": {\\"label\\": \\"Blu\\"},\n      \\"pt\\": {\\"label\\": \\"Azul\\"},\n      \\"de\\": {\\"label\\": \\"Blau\\"},\n      \\"nl\\": {\\"label\\": \\"Blauw\\"},\n      \\"zh\\": {\\"label\\": \\"蓝色\\"},\n      \\"ja\\": {\\"label\\": \\"青\\"}\n    }}, \n    {\\"id\\": \\"#FF7F39\\", \\"label\\": \\"Orange\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Naranja\\"},\n      \\"fr\\": {\\"label\\": \\"Orange\\"},\n      \\"it\\": {\\"label\\": \\"Arancione\\"},\n      \\"pt\\": {\\"label\\": \\"Laranja\\"},\n      \\"de\\": {\\"label\\": \\"Orange\\"},\n      \\"nl\\": {\\"label\\": \\"Oranje\\"},\n      \\"zh\\": {\\"label\\": \\"橙色\\"},\n      \\"ja\\": {\\"label\\": \\"オレンジ\\"}\n    }}, \n    {\\"id\\": \\"#D22D2D\\", \\"label\\": \\"Red\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Rojo\\"},\n      \\"fr\\": {\\"label\\": \\"Rouge\\"},\n      \\"it\\": {\\"label\\": \\"Rosso\\"},\n      \\"pt\\": {\\"label\\": \\"Vermelho\\"},\n      \\"de\\": {\\"label\\": \\"Rot\\"},\n      \\"nl\\": {\\"label\\": \\"Rood\\"},\n      \\"zh\\": {\\"label\\": \\"红色\\"},\n      \\"ja\\": {\\"label\\": \\"赤\\"}\n    }}, \n    {\\"id\\": \\"#FC84E2\\", \\"label\\": \\"Pink\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Rosa\\"},\n      \\"fr\\": {\\"label\\": \\"Rose\\"},\n      \\"it\\": {\\"label\\": \\"Rosa\\"},\n      \\"pt\\": {\\"label\\": \\"Rosa\\"},\n      \\"de\\": {\\"label\\": \\"Pink\\"},\n      \\"nl\\": {\\"label\\": \\"Roze\\"},\n      \\"zh\\": {\\"label\\": \\"粉色\\"},\n      \\"ja\\": {\\"label\\": \\"ピンク\\"}\n    }}, \n    {\\"id\\": \\"#A28DF7\\", \\"label\\": \\"Purple\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Morado\\"},\n      \\"fr\\": {\\"label\\": \\"Violet\\"},\n      \\"it\\": {\\"label\\": \\"Viola\\"},\n      \\"pt\\": {\\"label\\": \\"Roxo\\"},\n      \\"de\\": {\\"label\\": \\"Lila\\"},\n      \\"nl\\": {\\"label\\": \\"Paars\\"},\n      \\"zh\\": {\\"label\\": \\"紫色\\"},\n      \\"ja\\": {\\"label\\": \\"紫\\"}\n    }}, \n    {\\"id\\": \\"#6B7280\\", \\"label\\": \\"Gray\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Gris\\"},\n      \\"fr\\": {\\"label\\": \\"Gris\\"},\n      \\"it\\": {\\"label\\": \\"Grigio\\"},\n      \\"pt\\": {\\"label\\": \\"Cinza\\"},\n      \\"de\\": {\\"label\\": \\"Grau\\"},\n      \\"nl\\": {\\"label\\": \\"Grijs\\"},\n      \\"zh\\": {\\"label\\": \\"灰色\\"},\n      \\"ja\\": {\\"label\\": \\"グレー\\"}\n    }}, \n    {\\"id\\": \\"#4F46E5\\", \\"label\\": \\"Indigo\\", \\"translations\\": { \n      \\"es\\": {\\"label\\": \\"Índigo\\"},\n      \\"fr\\": {\\"label\\": \\"Indigo\\"},\n      \\"it\\": {\\"label\\": \\"Indaco\\"},\n      \\"pt\\": {\\"label\\": \\"Índigo\\"},\n      \\"de\\": {\\"label\\": \\"Indigo\\"},\n      \\"nl\\": {\\"label\\": \\"Indigo\\"},\n      \\"zh\\": {\\"label\\": \\"靛蓝\\"},\n      \\"ja\\": {\\"label\\": \\"インディゴ\\"}\n    }}\n  ]'::jsonb,\n  '{\n    \\"es\\": {\n      \\"label\\": \\"Color de Vestuario\\",\n      \\"description\\": \\"Selecciona tu color de vestuario preferido\\"\n    },\n    \\"fr\\": {\n      \\"label\\": \\"Couleur du Vêtement\\",\n      \\"description\\": \\"Sélectionnez la couleur de vêtement que vous préférez\\"\n    },\n    \\"it\\": {\n      \\"label\\": \\"Colore dell''Abbigliamento\\",\n      \\"description\\": \\"Seleziona il colore dell''abbigliamento che preferisci\\"\n    },\n    \\"pt\\": {\n      \\"label\\": \\"Cor da Roupa\\",\n      \\"description\\": \\"Selecione a cor da roupa de sua preferência\\"\n    },\n    \\"de\\": {\n      \\"label\\": \\"Kleidungsfarbe\\",\n      \\"description\\": \\"Wählen Sie Ihre bevorzugte Kleidungsfarbe\\"\n    },\n    \\"nl\\": {\n      \\"label\\": \\"Kleding Kleur\\",\n      \\"description\\": \\"Kies uw gewenste kleding kleur\\"\n    },\n    \\"zh\\": {\n      \\"label\\": \\"服装颜色\\",\n      \\"description\\": \\"选择您喜欢的服装颜色\\"\n    },\n    \\"ja\\": {\n      \\"label\\": \\"服の色\\",\n      \\"description\\": \\"お好みの服の色を選択してください\\"\n    }\n  }'::jsonb\n)\nON CONFLICT (category) DO UPDATE \nSET \n  label = EXCLUDED.label,\n  description = EXCLUDED.description,\n  options = EXCLUDED.options,\n  translations = EXCLUDED.translations"}	seed_style_data
20250429000001	{"-- Enable realtime for the styles table\nALTER PUBLICATION supabase_realtime ADD TABLE styles","-- Make sure RLS is enabled\nALTER TABLE styles ENABLE ROW LEVEL SECURITY","-- Add policy for realtime subscriptions if not exists\nDO $$ \nBEGIN\n    IF NOT EXISTS (\n        SELECT 1 \n        FROM pg_policies \n        WHERE tablename = 'styles' \n        AND policyname = 'Enable realtime for users own styles'\n    ) THEN\n        CREATE POLICY \\"Enable realtime for users own styles\\"\n            ON styles\n            FOR SELECT\n            TO authenticated\n            USING (auth.uid() = user_id);\n    END IF;\nEND\n$$"}	enable_realtime_for_styles
\.


--
-- Data for Name: seed_files; Type: TABLE DATA; Schema: supabase_migrations; Owner: postgres
--

COPY "supabase_migrations"."seed_files" ("path", "hash") FROM stdin;
supabase/seed.sql	7e9fe984109379e793250f8b9ebac1e1e1426a7bf33f7d5f4165bac36c868f62
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY "vault"."secrets" ("id", "name", "description", "secret", "key_id", "nonce", "created_at", "updated_at") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('"realtime"."subscription_id_seq"', 1, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- Name: extensions extensions_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "_realtime"."extensions"
    ADD CONSTRAINT "extensions_pkey" PRIMARY KEY ("id");


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "_realtime"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "_realtime"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "amr_id_pk" PRIMARY KEY ("id");


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."audit_log_entries"
    ADD CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id");


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."flow_state"
    ADD CONSTRAINT "flow_state_pkey" PRIMARY KEY ("id");


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_pkey" PRIMARY KEY ("id");


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_provider_id_provider_unique" UNIQUE ("provider_id", "provider");


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."instances"
    ADD CONSTRAINT "instances_pkey" PRIMARY KEY ("id");


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_authentication_method_pkey" UNIQUE ("session_id", "authentication_method");


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_pkey" PRIMARY KEY ("id");


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_last_challenged_at_key" UNIQUE ("last_challenged_at");


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_pkey" PRIMARY KEY ("id");


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_pkey" PRIMARY KEY ("id");


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_token_unique" UNIQUE ("token");


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_entity_id_key" UNIQUE ("entity_id");


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_pkey" PRIMARY KEY ("id");


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_pkey" PRIMARY KEY ("id");


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_pkey" PRIMARY KEY ("id");


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sso_providers"
    ADD CONSTRAINT "sso_providers_pkey" PRIMARY KEY ("id");


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");


--
-- Name: completed_user_journeys completed_user_journeys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."completed_user_journeys"
    ADD CONSTRAINT "completed_user_journeys_pkey" PRIMARY KEY ("id");


--
-- Name: images images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");


--
-- Name: style_configs style_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."style_configs"
    ADD CONSTRAINT "style_configs_pkey" PRIMARY KEY ("id");


--
-- Name: style_options style_options_category_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."style_options"
    ADD CONSTRAINT "style_options_category_unique" UNIQUE ("category");


--
-- Name: CONSTRAINT "style_options_category_unique" ON "style_options"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT "style_options_category_unique" ON "public"."style_options" IS 'Ensures each category (background, clothing, clothingColor) only appears once in the table to match API assumptions';


--
-- Name: style_options style_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."style_options"
    ADD CONSTRAINT "style_options_pkey" PRIMARY KEY ("id");


--
-- Name: styles styles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."styles"
    ADD CONSTRAINT "styles_pkey" PRIMARY KEY ("id");


--
-- Name: user_language_preferences user_language_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_language_preferences"
    ADD CONSTRAINT "user_language_preferences_pkey" PRIMARY KEY ("user_id");


--
-- Name: user_progress user_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id");


--
-- Name: user_progress user_progress_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_user_id_key" UNIQUE ("user_id");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY "realtime"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2025_05_02 messages_2025_05_02_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2025_05_02"
    ADD CONSTRAINT "messages_2025_05_02_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2025_05_03 messages_2025_05_03_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2025_05_03"
    ADD CONSTRAINT "messages_2025_05_03_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2025_05_04 messages_2025_05_04_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2025_05_04"
    ADD CONSTRAINT "messages_2025_05_04_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2025_05_05 messages_2025_05_05_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2025_05_05"
    ADD CONSTRAINT "messages_2025_05_05_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: messages_2025_05_06 messages_2025_05_06_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."messages_2025_05_06"
    ADD CONSTRAINT "messages_2025_05_06_pkey" PRIMARY KEY ("id", "inserted_at");


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."subscription"
    ADD CONSTRAINT "pk_subscription" PRIMARY KEY ("id");


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "realtime"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."buckets"
    ADD CONSTRAINT "buckets_pkey" PRIMARY KEY ("id");


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_name_key" UNIQUE ("name");


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_pkey" PRIMARY KEY ("id");


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_pkey" PRIMARY KEY ("id");


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_pkey" PRIMARY KEY ("id");


--
-- Name: hooks hooks_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: supabase_functions_admin
--

ALTER TABLE ONLY "supabase_functions"."hooks"
    ADD CONSTRAINT "hooks_pkey" PRIMARY KEY ("id");


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: supabase_functions_admin
--

ALTER TABLE ONLY "supabase_functions"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("version");


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY "supabase_migrations"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY "supabase_migrations"."seed_files"
    ADD CONSTRAINT "seed_files_pkey" PRIMARY KEY ("path");


--
-- Name: extensions_tenant_external_id_index; Type: INDEX; Schema: _realtime; Owner: supabase_admin
--

CREATE INDEX "extensions_tenant_external_id_index" ON "_realtime"."extensions" USING "btree" ("tenant_external_id");


--
-- Name: extensions_tenant_external_id_type_index; Type: INDEX; Schema: _realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX "extensions_tenant_external_id_type_index" ON "_realtime"."extensions" USING "btree" ("tenant_external_id", "type");


--
-- Name: tenants_external_id_index; Type: INDEX; Schema: _realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX "tenants_external_id_index" ON "_realtime"."tenants" USING "btree" ("external_id");


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "audit_logs_instance_id_idx" ON "auth"."audit_log_entries" USING "btree" ("instance_id");


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "confirmation_token_idx" ON "auth"."users" USING "btree" ("confirmation_token") WHERE (("confirmation_token")::"text" !~ '^[0-9 ]*$'::"text");


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "email_change_token_current_idx" ON "auth"."users" USING "btree" ("email_change_token_current") WHERE (("email_change_token_current")::"text" !~ '^[0-9 ]*$'::"text");


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "email_change_token_new_idx" ON "auth"."users" USING "btree" ("email_change_token_new") WHERE (("email_change_token_new")::"text" !~ '^[0-9 ]*$'::"text");


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "factor_id_created_at_idx" ON "auth"."mfa_factors" USING "btree" ("user_id", "created_at");


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "flow_state_created_at_idx" ON "auth"."flow_state" USING "btree" ("created_at" DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "identities_email_idx" ON "auth"."identities" USING "btree" ("email" "text_pattern_ops");


--
-- Name: INDEX "identities_email_idx"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX "auth"."identities_email_idx" IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "identities_user_id_idx" ON "auth"."identities" USING "btree" ("user_id");


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "idx_auth_code" ON "auth"."flow_state" USING "btree" ("auth_code");


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "idx_user_id_auth_method" ON "auth"."flow_state" USING "btree" ("user_id", "authentication_method");


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "mfa_challenge_created_at_idx" ON "auth"."mfa_challenges" USING "btree" ("created_at" DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "mfa_factors_user_friendly_name_unique" ON "auth"."mfa_factors" USING "btree" ("friendly_name", "user_id") WHERE (TRIM(BOTH FROM "friendly_name") <> ''::"text");


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "mfa_factors_user_id_idx" ON "auth"."mfa_factors" USING "btree" ("user_id");


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "one_time_tokens_relates_to_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("relates_to");


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "one_time_tokens_token_hash_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("token_hash");


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "one_time_tokens_user_id_token_type_key" ON "auth"."one_time_tokens" USING "btree" ("user_id", "token_type");


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "reauthentication_token_idx" ON "auth"."users" USING "btree" ("reauthentication_token") WHERE (("reauthentication_token")::"text" !~ '^[0-9 ]*$'::"text");


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "recovery_token_idx" ON "auth"."users" USING "btree" ("recovery_token") WHERE (("recovery_token")::"text" !~ '^[0-9 ]*$'::"text");


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "refresh_tokens_instance_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id");


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "refresh_tokens_instance_id_user_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id", "user_id");


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "refresh_tokens_parent_idx" ON "auth"."refresh_tokens" USING "btree" ("parent");


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "refresh_tokens_session_id_revoked_idx" ON "auth"."refresh_tokens" USING "btree" ("session_id", "revoked");


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "refresh_tokens_updated_at_idx" ON "auth"."refresh_tokens" USING "btree" ("updated_at" DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "saml_providers_sso_provider_id_idx" ON "auth"."saml_providers" USING "btree" ("sso_provider_id");


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "saml_relay_states_created_at_idx" ON "auth"."saml_relay_states" USING "btree" ("created_at" DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "saml_relay_states_for_email_idx" ON "auth"."saml_relay_states" USING "btree" ("for_email");


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "saml_relay_states_sso_provider_id_idx" ON "auth"."saml_relay_states" USING "btree" ("sso_provider_id");


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "sessions_not_after_idx" ON "auth"."sessions" USING "btree" ("not_after" DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "sessions_user_id_idx" ON "auth"."sessions" USING "btree" ("user_id");


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "sso_domains_domain_idx" ON "auth"."sso_domains" USING "btree" ("lower"("domain"));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "sso_domains_sso_provider_id_idx" ON "auth"."sso_domains" USING "btree" ("sso_provider_id");


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "sso_providers_resource_id_idx" ON "auth"."sso_providers" USING "btree" ("lower"("resource_id"));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "unique_phone_factor_per_user" ON "auth"."mfa_factors" USING "btree" ("user_id", "phone");


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "user_id_created_at_idx" ON "auth"."sessions" USING "btree" ("user_id", "created_at");


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX "users_email_partial_key" ON "auth"."users" USING "btree" ("email") WHERE ("is_sso_user" = false);


--
-- Name: INDEX "users_email_partial_key"; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX "auth"."users_email_partial_key" IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "users_instance_id_email_idx" ON "auth"."users" USING "btree" ("instance_id", "lower"(("email")::"text"));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "users_instance_id_idx" ON "auth"."users" USING "btree" ("instance_id");


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX "users_is_anonymous_idx" ON "auth"."users" USING "btree" ("is_anonymous");


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX "ix_realtime_subscription_entity" ON "realtime"."subscription" USING "btree" ("entity");


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX "subscription_subscription_id_entity_filters_key" ON "realtime"."subscription" USING "btree" ("subscription_id", "entity", "filters");


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX "bname" ON "storage"."buckets" USING "btree" ("name");


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX "bucketid_objname" ON "storage"."objects" USING "btree" ("bucket_id", "name");


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX "idx_multipart_uploads_list" ON "storage"."s3_multipart_uploads" USING "btree" ("bucket_id", "key", "created_at");


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX "idx_objects_bucket_id_name" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX "name_prefix_search" ON "storage"."objects" USING "btree" ("name" "text_pattern_ops");


--
-- Name: supabase_functions_hooks_h_table_id_h_name_idx; Type: INDEX; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE INDEX "supabase_functions_hooks_h_table_id_h_name_idx" ON "supabase_functions"."hooks" USING "btree" ("hook_table_id", "hook_name");


--
-- Name: supabase_functions_hooks_request_id_idx; Type: INDEX; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE INDEX "supabase_functions_hooks_request_id_idx" ON "supabase_functions"."hooks" USING "btree" ("request_id");


--
-- Name: messages_2025_05_02_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_05_02_pkey";


--
-- Name: messages_2025_05_03_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_05_03_pkey";


--
-- Name: messages_2025_05_04_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_05_04_pkey";


--
-- Name: messages_2025_05_05_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_05_05_pkey";


--
-- Name: messages_2025_05_06_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_05_06_pkey";


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();


--
-- Name: styles set_style_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "set_style_id" BEFORE INSERT ON "public"."styles" FOR EACH ROW EXECUTE FUNCTION "public"."generate_style_id"();


--
-- Name: completed_user_journeys update_completed_user_journeys_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_completed_user_journeys_updated_at" BEFORE UPDATE ON "public"."completed_user_journeys" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: images update_images_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_images_updated_at" BEFORE UPDATE ON "public"."images" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: sessions update_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_sessions_updated_at" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: style_configs update_style_configs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_style_configs_updated_at" BEFORE UPDATE ON "public"."style_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: style_options update_style_options_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_style_options_updated_at" BEFORE UPDATE ON "public"."style_options" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: styles update_styles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_styles_updated_at" BEFORE UPDATE ON "public"."styles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: user_progress update_user_progress_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_user_progress_updated_at" BEFORE UPDATE ON "public"."user_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER "tr_check_filters" BEFORE INSERT OR UPDATE ON "realtime"."subscription" FOR EACH ROW EXECUTE FUNCTION "realtime"."subscription_check_filters"();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER "update_objects_updated_at" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."update_updated_at_column"();


--
-- Name: extensions extensions_tenant_external_id_fkey; Type: FK CONSTRAINT; Schema: _realtime; Owner: supabase_admin
--

ALTER TABLE ONLY "_realtime"."extensions"
    ADD CONSTRAINT "extensions_tenant_external_id_fkey" FOREIGN KEY ("tenant_external_id") REFERENCES "_realtime"."tenants"("external_id") ON DELETE CASCADE;


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_auth_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "auth"."mfa_factors"("id") ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_flow_state_id_fkey" FOREIGN KEY ("flow_state_id") REFERENCES "auth"."flow_state"("id") ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;


--
-- Name: completed_user_journeys completed_user_journeys_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."completed_user_journeys"
    ADD CONSTRAINT "completed_user_journeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: images images_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;


--
-- Name: images images_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: styles styles_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."styles"
    ADD CONSTRAINT "styles_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;


--
-- Name: CONSTRAINT "styles_order_id_fkey" ON "styles"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT "styles_order_id_fkey" ON "public"."styles" IS 'Links styles to their associated order, cascade deletes styles when order is deleted';


--
-- Name: styles styles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."styles"
    ADD CONSTRAINT "styles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: user_language_preferences user_language_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_language_preferences"
    ADD CONSTRAINT "user_language_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: user_progress user_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "storage"."s3_multipart_uploads"("id") ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."audit_log_entries" ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."flow_state" ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."identities" ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."instances" ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."mfa_amr_claims" ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."mfa_challenges" ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."mfa_factors" ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."one_time_tokens" ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."refresh_tokens" ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."saml_providers" ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."saml_relay_states" ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."schema_migrations" ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."sessions" ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."sso_domains" ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."sso_providers" ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE "auth"."users" ENABLE ROW LEVEL SECURITY;

--
-- Name: users Allow insert during signup; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow insert during signup" ON "public"."users" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);


--
-- Name: style_configs Allow public read access to style_configs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read access to style_configs" ON "public"."style_configs" FOR SELECT TO "authenticated", "anon" USING (true);


--
-- Name: style_options Allow public read access to style_options; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read access to style_options" ON "public"."style_options" FOR SELECT TO "authenticated", "anon" USING (true);


--
-- Name: styles Enable realtime for users own styles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable realtime for users own styles" ON "public"."styles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: sessions Users can delete their own sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own sessions" ON "public"."sessions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: user_language_preferences Users can insert their own language preference; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert their own language preference" ON "public"."user_language_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: images Users can manage their own images; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage their own images" ON "public"."images" TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: orders Users can manage their own orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage their own orders" ON "public"."orders" TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: user_progress Users can manage their own progress; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage their own progress" ON "public"."user_progress" TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: styles Users can manage their own styles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can manage their own styles" ON "public"."styles" TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: user_language_preferences Users can read their own language preference; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own language preference" ON "public"."user_language_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: user_language_preferences Users can update their own language preference; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own language preference" ON "public"."user_language_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: users Users can update their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));


--
-- Name: completed_user_journeys Users can view their own completed journeys; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own completed journeys" ON "public"."completed_user_journeys" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: users Users can view their own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own profile" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));


--
-- Name: sessions Users can view their own sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own sessions" ON "public"."sessions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: completed_user_journeys; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."completed_user_journeys" ENABLE ROW LEVEL SECURITY;

--
-- Name: images; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;

--
-- Name: style_configs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."style_configs" ENABLE ROW LEVEL SECURITY;

--
-- Name: style_options; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."style_options" ENABLE ROW LEVEL SECURITY;

--
-- Name: styles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."styles" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_language_preferences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_language_preferences" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_progress; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_progress" ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE "realtime"."messages" ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."buckets" ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."migrations" ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."s3_multipart_uploads" ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE "storage"."s3_multipart_uploads_parts" ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION "supabase_realtime" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--

CREATE PUBLICATION "supabase_realtime_messages_publication" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime_messages_publication" OWNER TO "supabase_admin";

--
-- Name: supabase_realtime styles; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."styles";


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: supabase_admin
--

ALTER PUBLICATION "supabase_realtime_messages_publication" ADD TABLE ONLY "realtime"."messages";


--
-- Name: SCHEMA "auth"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA "auth" TO "anon";
GRANT USAGE ON SCHEMA "auth" TO "authenticated";
GRANT USAGE ON SCHEMA "auth" TO "service_role";
GRANT ALL ON SCHEMA "auth" TO "supabase_auth_admin";
GRANT ALL ON SCHEMA "auth" TO "dashboard_user";
GRANT ALL ON SCHEMA "auth" TO "postgres";


--
-- Name: SCHEMA "extensions"; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA "extensions" TO "anon";
GRANT USAGE ON SCHEMA "extensions" TO "authenticated";
GRANT USAGE ON SCHEMA "extensions" TO "service_role";
GRANT ALL ON SCHEMA "extensions" TO "dashboard_user";


--
-- Name: SCHEMA "net"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA "net" TO "supabase_functions_admin";
GRANT USAGE ON SCHEMA "net" TO "postgres";
GRANT USAGE ON SCHEMA "net" TO "anon";
GRANT USAGE ON SCHEMA "net" TO "authenticated";
GRANT USAGE ON SCHEMA "net" TO "service_role";


--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: SCHEMA "realtime"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA "realtime" TO "postgres";
GRANT USAGE ON SCHEMA "realtime" TO "anon";
GRANT USAGE ON SCHEMA "realtime" TO "authenticated";
GRANT USAGE ON SCHEMA "realtime" TO "service_role";
GRANT ALL ON SCHEMA "realtime" TO "supabase_realtime_admin";


--
-- Name: SCHEMA "storage"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT ALL ON SCHEMA "storage" TO "postgres";
GRANT USAGE ON SCHEMA "storage" TO "anon";
GRANT USAGE ON SCHEMA "storage" TO "authenticated";
GRANT USAGE ON SCHEMA "storage" TO "service_role";
GRANT ALL ON SCHEMA "storage" TO "supabase_storage_admin";
GRANT ALL ON SCHEMA "storage" TO "dashboard_user";


--
-- Name: SCHEMA "supabase_functions"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA "supabase_functions" TO "postgres";
GRANT USAGE ON SCHEMA "supabase_functions" TO "anon";
GRANT USAGE ON SCHEMA "supabase_functions" TO "authenticated";
GRANT USAGE ON SCHEMA "supabase_functions" TO "service_role";
GRANT ALL ON SCHEMA "supabase_functions" TO "supabase_functions_admin";


--
-- Name: SCHEMA "vault"; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA "vault" TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "email"(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION "auth"."email"() TO "dashboard_user";


--
-- Name: FUNCTION "jwt"(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION "auth"."jwt"() TO "postgres";
GRANT ALL ON FUNCTION "auth"."jwt"() TO "dashboard_user";


--
-- Name: FUNCTION "role"(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION "auth"."role"() TO "dashboard_user";


--
-- Name: FUNCTION "uid"(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION "auth"."uid"() TO "dashboard_user";


--
-- Name: FUNCTION "algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "armor"("bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "armor"("bytea", "text"[], "text"[]); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "crypt"("text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "dearmor"("text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "decrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "digest"("bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "digest"("text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "encrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "encrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "gen_random_bytes"(integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "gen_random_uuid"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "gen_salt"("text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "gen_salt"("text", integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "grant_pg_cron_access"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."grant_pg_cron_access"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."grant_pg_cron_access"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."grant_pg_cron_access"() TO "dashboard_user";


--
-- Name: FUNCTION "grant_pg_graphql_access"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."grant_pg_graphql_access"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "grant_pg_net_access"(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION "extensions"."grant_pg_net_access"() FROM "postgres";
GRANT ALL ON FUNCTION "extensions"."grant_pg_net_access"() TO "postgres" WITH GRANT OPTION;
GRANT ALL ON FUNCTION "extensions"."grant_pg_net_access"() TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "hmac"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "blk_read_time" double precision, OUT "blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "blk_read_time" double precision, OUT "blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint) TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_key_id"("bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgrst_ddl_watch"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgrst_ddl_watch"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "pgrst_drop_watch"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."pgrst_drop_watch"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "set_graphql_placeholder"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."set_graphql_placeholder"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "sign"("payload" "json", "secret" "text", "algorithm" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."sign"("payload" "json", "secret" "text", "algorithm" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."sign"("payload" "json", "secret" "text", "algorithm" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "try_cast_double"("inp" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."try_cast_double"("inp" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."try_cast_double"("inp" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "url_decode"("data" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."url_decode"("data" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."url_decode"("data" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "url_encode"("data" "bytea"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."url_encode"("data" "bytea") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."url_encode"("data" "bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_generate_v1"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_generate_v1mc"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_generate_v3"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_generate_v4"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_generate_v5"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_nil"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_ns_dns"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_ns_oid"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_ns_url"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "uuid_ns_x500"(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "verify"("token" "text", "secret" "text", "algorithm" "text"); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "extensions"."verify"("token" "text", "secret" "text", "algorithm" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "extensions"."verify"("token" "text", "secret" "text", "algorithm" "text") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb"); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "service_role";


--
-- Name: FUNCTION "http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer); Type: ACL; Schema: net; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "supabase_functions_admin";
GRANT ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "postgres";
GRANT ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "anon";
GRANT ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "net"."http_get"("url" "text", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "service_role";


--
-- Name: FUNCTION "http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer); Type: ACL; Schema: net; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "supabase_functions_admin";
GRANT ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "postgres";
GRANT ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "anon";
GRANT ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "net"."http_post"("url" "text", "body" "jsonb", "params" "jsonb", "headers" "jsonb", "timeout_milliseconds" integer) TO "service_role";


--
-- Name: FUNCTION "get_auth"("p_usename" "text"); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION "pgbouncer"."get_auth"("p_usename" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "pgbouncer"."get_auth"("p_usename" "text") TO "pgbouncer";
GRANT ALL ON FUNCTION "pgbouncer"."get_auth"("p_usename" "text") TO "postgres";


--
-- Name: FUNCTION "generate_style_id"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."generate_style_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_style_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_style_id"() TO "service_role";


--
-- Name: FUNCTION "get_language_preference"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_language_preference"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_language_preference"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_language_preference"() TO "service_role";


--
-- Name: FUNCTION "handle_new_user"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


--
-- Name: FUNCTION "update_language_preference"("new_language" character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_language_preference"("new_language" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."update_language_preference"("new_language" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_language_preference"("new_language" character varying) TO "service_role";


--
-- Name: FUNCTION "update_updated_at_column"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


--
-- Name: FUNCTION "apply_rls"("wal" "jsonb", "max_record_bytes" integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "anon";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "supabase_realtime_admin";


--
-- Name: FUNCTION "broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text"); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text") TO "dashboard_user";


--
-- Name: FUNCTION "build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "anon";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "supabase_realtime_admin";


--
-- Name: FUNCTION "cast"("val" "text", "type_" "regtype"); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "anon";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "supabase_realtime_admin";


--
-- Name: FUNCTION "check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text"); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "anon";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "supabase_realtime_admin";


--
-- Name: FUNCTION "is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "anon";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "supabase_realtime_admin";


--
-- Name: FUNCTION "list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "anon";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "supabase_realtime_admin";


--
-- Name: FUNCTION "quote_wal2json"("entity" "regclass"); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "anon";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "supabase_realtime_admin";


--
-- Name: FUNCTION "send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean) TO "dashboard_user";


--
-- Name: FUNCTION "subscription_check_filters"(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "postgres";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "anon";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "service_role";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "supabase_realtime_admin";


--
-- Name: FUNCTION "to_regrole"("role_name" "text"); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "supabase_realtime_admin";


--
-- Name: FUNCTION "topic"(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION "realtime"."topic"() TO "postgres";
GRANT ALL ON FUNCTION "realtime"."topic"() TO "dashboard_user";


--
-- Name: FUNCTION "http_request"(); Type: ACL; Schema: supabase_functions; Owner: supabase_functions_admin
--

REVOKE ALL ON FUNCTION "supabase_functions"."http_request"() FROM PUBLIC;
GRANT ALL ON FUNCTION "supabase_functions"."http_request"() TO "postgres";
GRANT ALL ON FUNCTION "supabase_functions"."http_request"() TO "anon";
GRANT ALL ON FUNCTION "supabase_functions"."http_request"() TO "authenticated";
GRANT ALL ON FUNCTION "supabase_functions"."http_request"() TO "service_role";


--
-- Name: FUNCTION "_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea"); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "vault"."_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "vault"."create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;


--
-- Name: FUNCTION "update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "vault"."update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "audit_log_entries"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."audit_log_entries" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."audit_log_entries" TO "postgres";
GRANT SELECT ON TABLE "auth"."audit_log_entries" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "flow_state"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."flow_state" TO "postgres";
GRANT SELECT ON TABLE "auth"."flow_state" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."flow_state" TO "dashboard_user";


--
-- Name: TABLE "identities"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."identities" TO "postgres";
GRANT SELECT ON TABLE "auth"."identities" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."identities" TO "dashboard_user";


--
-- Name: TABLE "instances"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."instances" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."instances" TO "postgres";
GRANT SELECT ON TABLE "auth"."instances" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "mfa_amr_claims"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."mfa_amr_claims" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_amr_claims" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_amr_claims" TO "dashboard_user";


--
-- Name: TABLE "mfa_challenges"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."mfa_challenges" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_challenges" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_challenges" TO "dashboard_user";


--
-- Name: TABLE "mfa_factors"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."mfa_factors" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_factors" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_factors" TO "dashboard_user";


--
-- Name: TABLE "one_time_tokens"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."one_time_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."one_time_tokens" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."one_time_tokens" TO "dashboard_user";


--
-- Name: TABLE "refresh_tokens"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."refresh_tokens" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."refresh_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."refresh_tokens" TO "postgres" WITH GRANT OPTION;


--
-- Name: SEQUENCE "refresh_tokens_id_seq"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "dashboard_user";
GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "postgres";


--
-- Name: TABLE "saml_providers"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."saml_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_providers" TO "dashboard_user";


--
-- Name: TABLE "saml_relay_states"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."saml_relay_states" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_relay_states" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_relay_states" TO "dashboard_user";


--
-- Name: TABLE "schema_migrations"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."schema_migrations" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."schema_migrations" TO "postgres";
GRANT SELECT ON TABLE "auth"."schema_migrations" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "sessions"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."sessions" TO "postgres";
GRANT SELECT ON TABLE "auth"."sessions" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sessions" TO "dashboard_user";


--
-- Name: TABLE "sso_domains"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."sso_domains" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_domains" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_domains" TO "dashboard_user";


--
-- Name: TABLE "sso_providers"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."sso_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_providers" TO "dashboard_user";


--
-- Name: TABLE "users"; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE "auth"."users" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "auth"."users" TO "postgres";
GRANT SELECT ON TABLE "auth"."users" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "pg_stat_statements"; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE "extensions"."pg_stat_statements" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "pg_stat_statements_info"; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE "extensions"."pg_stat_statements_info" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "completed_user_journeys"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."completed_user_journeys" TO "anon";
GRANT ALL ON TABLE "public"."completed_user_journeys" TO "authenticated";
GRANT ALL ON TABLE "public"."completed_user_journeys" TO "service_role";


--
-- Name: TABLE "images"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."images" TO "anon";
GRANT ALL ON TABLE "public"."images" TO "authenticated";
GRANT ALL ON TABLE "public"."images" TO "service_role";


--
-- Name: TABLE "orders"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";


--
-- Name: TABLE "sessions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";


--
-- Name: TABLE "style_configs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."style_configs" TO "anon";
GRANT ALL ON TABLE "public"."style_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."style_configs" TO "service_role";


--
-- Name: TABLE "style_options"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."style_options" TO "anon";
GRANT ALL ON TABLE "public"."style_options" TO "authenticated";
GRANT ALL ON TABLE "public"."style_options" TO "service_role";


--
-- Name: TABLE "styles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."styles" TO "anon";
GRANT ALL ON TABLE "public"."styles" TO "authenticated";
GRANT ALL ON TABLE "public"."styles" TO "service_role";


--
-- Name: TABLE "user_language_preferences"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_language_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_language_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_language_preferences" TO "service_role";


--
-- Name: TABLE "user_progress"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_progress" TO "service_role";


--
-- Name: TABLE "users"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";


--
-- Name: TABLE "messages"; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE "realtime"."messages" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages" TO "dashboard_user";
GRANT SELECT,INSERT,UPDATE ON TABLE "realtime"."messages" TO "anon";
GRANT SELECT,INSERT,UPDATE ON TABLE "realtime"."messages" TO "authenticated";
GRANT SELECT,INSERT,UPDATE ON TABLE "realtime"."messages" TO "service_role";


--
-- Name: TABLE "messages_2025_05_02"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2025_05_02" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_05_02" TO "dashboard_user";


--
-- Name: TABLE "messages_2025_05_03"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2025_05_03" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_05_03" TO "dashboard_user";


--
-- Name: TABLE "messages_2025_05_04"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2025_05_04" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_05_04" TO "dashboard_user";


--
-- Name: TABLE "messages_2025_05_05"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2025_05_05" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_05_05" TO "dashboard_user";


--
-- Name: TABLE "messages_2025_05_06"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."messages_2025_05_06" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_05_06" TO "dashboard_user";


--
-- Name: TABLE "schema_migrations"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."schema_migrations" TO "postgres";
GRANT ALL ON TABLE "realtime"."schema_migrations" TO "dashboard_user";
GRANT SELECT ON TABLE "realtime"."schema_migrations" TO "anon";
GRANT SELECT ON TABLE "realtime"."schema_migrations" TO "authenticated";
GRANT SELECT ON TABLE "realtime"."schema_migrations" TO "service_role";
GRANT ALL ON TABLE "realtime"."schema_migrations" TO "supabase_realtime_admin";


--
-- Name: TABLE "subscription"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE "realtime"."subscription" TO "postgres";
GRANT ALL ON TABLE "realtime"."subscription" TO "dashboard_user";
GRANT SELECT ON TABLE "realtime"."subscription" TO "anon";
GRANT SELECT ON TABLE "realtime"."subscription" TO "authenticated";
GRANT SELECT ON TABLE "realtime"."subscription" TO "service_role";
GRANT ALL ON TABLE "realtime"."subscription" TO "supabase_realtime_admin";


--
-- Name: SEQUENCE "subscription_id_seq"; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE "realtime"."subscription_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "realtime"."subscription_id_seq" TO "dashboard_user";
GRANT USAGE ON SEQUENCE "realtime"."subscription_id_seq" TO "anon";
GRANT USAGE ON SEQUENCE "realtime"."subscription_id_seq" TO "authenticated";
GRANT USAGE ON SEQUENCE "realtime"."subscription_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "realtime"."subscription_id_seq" TO "supabase_realtime_admin";


--
-- Name: TABLE "buckets"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."buckets" TO "anon";
GRANT ALL ON TABLE "storage"."buckets" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets" TO "postgres";


--
-- Name: TABLE "migrations"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."migrations" TO "anon";
GRANT ALL ON TABLE "storage"."migrations" TO "authenticated";
GRANT ALL ON TABLE "storage"."migrations" TO "service_role";
GRANT ALL ON TABLE "storage"."migrations" TO "postgres";


--
-- Name: TABLE "objects"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."objects" TO "anon";
GRANT ALL ON TABLE "storage"."objects" TO "authenticated";
GRANT ALL ON TABLE "storage"."objects" TO "service_role";
GRANT ALL ON TABLE "storage"."objects" TO "postgres";


--
-- Name: TABLE "s3_multipart_uploads"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."s3_multipart_uploads" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "anon";


--
-- Name: TABLE "s3_multipart_uploads_parts"; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE "storage"."s3_multipart_uploads_parts" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "anon";


--
-- Name: TABLE "hooks"; Type: ACL; Schema: supabase_functions; Owner: supabase_functions_admin
--

GRANT ALL ON TABLE "supabase_functions"."hooks" TO "postgres";
GRANT ALL ON TABLE "supabase_functions"."hooks" TO "anon";
GRANT ALL ON TABLE "supabase_functions"."hooks" TO "authenticated";
GRANT ALL ON TABLE "supabase_functions"."hooks" TO "service_role";


--
-- Name: SEQUENCE "hooks_id_seq"; Type: ACL; Schema: supabase_functions; Owner: supabase_functions_admin
--

GRANT ALL ON SEQUENCE "supabase_functions"."hooks_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "supabase_functions"."hooks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "supabase_functions"."hooks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "supabase_functions"."hooks_id_seq" TO "service_role";


--
-- Name: TABLE "migrations"; Type: ACL; Schema: supabase_functions; Owner: supabase_functions_admin
--

GRANT ALL ON TABLE "supabase_functions"."migrations" TO "postgres";
GRANT ALL ON TABLE "supabase_functions"."migrations" TO "anon";
GRANT ALL ON TABLE "supabase_functions"."migrations" TO "authenticated";
GRANT ALL ON TABLE "supabase_functions"."migrations" TO "service_role";


--
-- Name: TABLE "secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,DELETE ON TABLE "vault"."secrets" TO "postgres" WITH GRANT OPTION;


--
-- Name: TABLE "decrypted_secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,DELETE ON TABLE "vault"."decrypted_secrets" TO "postgres" WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "extensions" GRANT ALL ON SEQUENCES  TO "postgres" WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "extensions" GRANT ALL ON FUNCTIONS  TO "postgres" WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "extensions" GRANT ALL ON TABLES  TO "postgres" WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "graphql_public" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON SEQUENCES  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON FUNCTIONS  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "realtime" GRANT ALL ON TABLES  TO "dashboard_user";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: supabase_functions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: supabase_functions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: supabase_functions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "supabase_functions" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "issue_graphql_placeholder" ON "sql_drop"
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION "extensions"."set_graphql_placeholder"();


ALTER EVENT TRIGGER "issue_graphql_placeholder" OWNER TO "supabase_admin";

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "issue_pg_cron_access" ON "ddl_command_end"
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION "extensions"."grant_pg_cron_access"();


ALTER EVENT TRIGGER "issue_pg_cron_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "issue_pg_graphql_access" ON "ddl_command_end"
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION "extensions"."grant_pg_graphql_access"();


ALTER EVENT TRIGGER "issue_pg_graphql_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: postgres
--

CREATE EVENT TRIGGER "issue_pg_net_access" ON "ddl_command_end"
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION "extensions"."grant_pg_net_access"();


ALTER EVENT TRIGGER "issue_pg_net_access" OWNER TO "postgres";

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "pgrst_ddl_watch" ON "ddl_command_end"
   EXECUTE FUNCTION "extensions"."pgrst_ddl_watch"();


ALTER EVENT TRIGGER "pgrst_ddl_watch" OWNER TO "supabase_admin";

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER "pgrst_drop_watch" ON "sql_drop"
   EXECUTE FUNCTION "extensions"."pgrst_drop_watch"();


ALTER EVENT TRIGGER "pgrst_drop_watch" OWNER TO "supabase_admin";

--
-- PostgreSQL database dump complete
--

