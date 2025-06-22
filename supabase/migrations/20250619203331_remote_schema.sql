drop trigger if exists "update_generated_images_updated_at" on "public"."generated_images";

drop trigger if exists "update_upload_chunks_updated_at" on "public"."upload_chunks";

drop trigger if exists "update_upload_sessions_updated_at" on "public"."upload_sessions";

drop policy "Users can manage their own generated images" on "public"."generated_images";

drop policy "Users can manage chunks for their own upload sessions" on "public"."upload_chunks";

drop policy "Users can manage their own upload sessions" on "public"."upload_sessions";

drop policy "Users can manage their own language preferences" on "public"."user_language_preferences";

drop policy "Enable read access for authenticated users" on "public"."users";

drop policy "Users can update their own data" on "public"."users";

drop policy "Users can manage their own images" on "public"."images";

drop policy "Users can manage their own orders" on "public"."orders";

drop policy "Allow public read access to style_configs" on "public"."style_configs";

drop policy "Allow public read access to style_options" on "public"."style_options";

drop policy "Users can manage their own styles" on "public"."styles";

drop policy "Users can manage their own progress" on "public"."user_progress";

revoke delete on table "public"."completed_user_journeys" from "anon";

revoke insert on table "public"."completed_user_journeys" from "anon";

revoke references on table "public"."completed_user_journeys" from "anon";

revoke select on table "public"."completed_user_journeys" from "anon";

revoke trigger on table "public"."completed_user_journeys" from "anon";

revoke truncate on table "public"."completed_user_journeys" from "anon";

revoke update on table "public"."completed_user_journeys" from "anon";

revoke delete on table "public"."completed_user_journeys" from "service_role";

revoke insert on table "public"."completed_user_journeys" from "service_role";

revoke references on table "public"."completed_user_journeys" from "service_role";

revoke select on table "public"."completed_user_journeys" from "service_role";

revoke trigger on table "public"."completed_user_journeys" from "service_role";

revoke truncate on table "public"."completed_user_journeys" from "service_role";

revoke update on table "public"."completed_user_journeys" from "service_role";

revoke delete on table "public"."face_models" from "anon";

revoke insert on table "public"."face_models" from "anon";

revoke references on table "public"."face_models" from "anon";

revoke trigger on table "public"."face_models" from "anon";

revoke truncate on table "public"."face_models" from "anon";

revoke update on table "public"."face_models" from "anon";

revoke references on table "public"."face_models" from "authenticated";

revoke trigger on table "public"."face_models" from "authenticated";

revoke truncate on table "public"."face_models" from "authenticated";

revoke delete on table "public"."generated_images" from "anon";

revoke insert on table "public"."generated_images" from "anon";

revoke references on table "public"."generated_images" from "anon";

revoke trigger on table "public"."generated_images" from "anon";

revoke truncate on table "public"."generated_images" from "anon";

revoke update on table "public"."generated_images" from "anon";

revoke references on table "public"."generated_images" from "authenticated";

revoke trigger on table "public"."generated_images" from "authenticated";

revoke truncate on table "public"."generated_images" from "authenticated";

revoke delete on table "public"."generated_images" from "service_role";

revoke insert on table "public"."generated_images" from "service_role";

revoke references on table "public"."generated_images" from "service_role";

revoke select on table "public"."generated_images" from "service_role";

revoke trigger on table "public"."generated_images" from "service_role";

revoke truncate on table "public"."generated_images" from "service_role";

revoke update on table "public"."generated_images" from "service_role";

revoke delete on table "public"."image_processing_jobs" from "anon";

revoke insert on table "public"."image_processing_jobs" from "anon";

revoke references on table "public"."image_processing_jobs" from "anon";

revoke trigger on table "public"."image_processing_jobs" from "anon";

revoke truncate on table "public"."image_processing_jobs" from "anon";

revoke update on table "public"."image_processing_jobs" from "anon";

revoke references on table "public"."image_processing_jobs" from "authenticated";

revoke trigger on table "public"."image_processing_jobs" from "authenticated";

revoke truncate on table "public"."image_processing_jobs" from "authenticated";

revoke delete on table "public"."image_processing_jobs" from "service_role";

revoke insert on table "public"."image_processing_jobs" from "service_role";

revoke references on table "public"."image_processing_jobs" from "service_role";

revoke select on table "public"."image_processing_jobs" from "service_role";

revoke trigger on table "public"."image_processing_jobs" from "service_role";

revoke truncate on table "public"."image_processing_jobs" from "service_role";

revoke update on table "public"."image_processing_jobs" from "service_role";

revoke delete on table "public"."images" from "anon";

revoke insert on table "public"."images" from "anon";

revoke references on table "public"."images" from "anon";

revoke select on table "public"."images" from "anon";

revoke trigger on table "public"."images" from "anon";

revoke truncate on table "public"."images" from "anon";

revoke update on table "public"."images" from "anon";

revoke delete on table "public"."images" from "service_role";

revoke insert on table "public"."images" from "service_role";

revoke references on table "public"."images" from "service_role";

revoke select on table "public"."images" from "service_role";

revoke trigger on table "public"."images" from "service_role";

revoke truncate on table "public"."images" from "service_role";

revoke update on table "public"."images" from "service_role";

revoke delete on table "public"."inference_jobs" from "anon";

revoke insert on table "public"."inference_jobs" from "anon";

revoke references on table "public"."inference_jobs" from "anon";

revoke trigger on table "public"."inference_jobs" from "anon";

revoke truncate on table "public"."inference_jobs" from "anon";

revoke update on table "public"."inference_jobs" from "anon";

revoke references on table "public"."inference_jobs" from "authenticated";

revoke trigger on table "public"."inference_jobs" from "authenticated";

revoke truncate on table "public"."inference_jobs" from "authenticated";

revoke delete on table "public"."orders" from "anon";

revoke insert on table "public"."orders" from "anon";

revoke references on table "public"."orders" from "anon";

revoke select on table "public"."orders" from "anon";

revoke trigger on table "public"."orders" from "anon";

revoke truncate on table "public"."orders" from "anon";

revoke update on table "public"."orders" from "anon";

revoke delete on table "public"."orders" from "service_role";

revoke insert on table "public"."orders" from "service_role";

revoke references on table "public"."orders" from "service_role";

revoke select on table "public"."orders" from "service_role";

revoke trigger on table "public"."orders" from "service_role";

revoke truncate on table "public"."orders" from "service_role";

revoke update on table "public"."orders" from "service_role";

revoke delete on table "public"."sessions" from "anon";

revoke insert on table "public"."sessions" from "anon";

revoke references on table "public"."sessions" from "anon";

revoke select on table "public"."sessions" from "anon";

revoke trigger on table "public"."sessions" from "anon";

revoke truncate on table "public"."sessions" from "anon";

revoke update on table "public"."sessions" from "anon";

revoke delete on table "public"."sessions" from "service_role";

revoke insert on table "public"."sessions" from "service_role";

revoke references on table "public"."sessions" from "service_role";

revoke select on table "public"."sessions" from "service_role";

revoke trigger on table "public"."sessions" from "service_role";

revoke truncate on table "public"."sessions" from "service_role";

revoke update on table "public"."sessions" from "service_role";

revoke delete on table "public"."style_configs" from "anon";

revoke insert on table "public"."style_configs" from "anon";

revoke references on table "public"."style_configs" from "anon";

revoke trigger on table "public"."style_configs" from "anon";

revoke truncate on table "public"."style_configs" from "anon";

revoke update on table "public"."style_configs" from "anon";

revoke delete on table "public"."style_configs" from "service_role";

revoke insert on table "public"."style_configs" from "service_role";

revoke references on table "public"."style_configs" from "service_role";

revoke select on table "public"."style_configs" from "service_role";

revoke trigger on table "public"."style_configs" from "service_role";

revoke truncate on table "public"."style_configs" from "service_role";

revoke update on table "public"."style_configs" from "service_role";

revoke delete on table "public"."style_options" from "anon";

revoke insert on table "public"."style_options" from "anon";

revoke references on table "public"."style_options" from "anon";

revoke trigger on table "public"."style_options" from "anon";

revoke truncate on table "public"."style_options" from "anon";

revoke update on table "public"."style_options" from "anon";

revoke delete on table "public"."style_options" from "service_role";

revoke insert on table "public"."style_options" from "service_role";

revoke references on table "public"."style_options" from "service_role";

revoke select on table "public"."style_options" from "service_role";

revoke trigger on table "public"."style_options" from "service_role";

revoke truncate on table "public"."style_options" from "service_role";

revoke update on table "public"."style_options" from "service_role";

revoke delete on table "public"."styles" from "anon";

revoke insert on table "public"."styles" from "anon";

revoke references on table "public"."styles" from "anon";

revoke select on table "public"."styles" from "anon";

revoke trigger on table "public"."styles" from "anon";

revoke truncate on table "public"."styles" from "anon";

revoke update on table "public"."styles" from "anon";

revoke delete on table "public"."styles" from "service_role";

revoke insert on table "public"."styles" from "service_role";

revoke references on table "public"."styles" from "service_role";

revoke select on table "public"."styles" from "service_role";

revoke trigger on table "public"."styles" from "service_role";

revoke truncate on table "public"."styles" from "service_role";

revoke update on table "public"."styles" from "service_role";

revoke delete on table "public"."training_jobs" from "anon";

revoke insert on table "public"."training_jobs" from "anon";

revoke references on table "public"."training_jobs" from "anon";

revoke trigger on table "public"."training_jobs" from "anon";

revoke truncate on table "public"."training_jobs" from "anon";

revoke update on table "public"."training_jobs" from "anon";

revoke references on table "public"."training_jobs" from "authenticated";

revoke trigger on table "public"."training_jobs" from "authenticated";

revoke truncate on table "public"."training_jobs" from "authenticated";

revoke delete on table "public"."upload_chunks" from "anon";

revoke insert on table "public"."upload_chunks" from "anon";

revoke references on table "public"."upload_chunks" from "anon";

revoke trigger on table "public"."upload_chunks" from "anon";

revoke truncate on table "public"."upload_chunks" from "anon";

revoke update on table "public"."upload_chunks" from "anon";

revoke references on table "public"."upload_chunks" from "authenticated";

revoke trigger on table "public"."upload_chunks" from "authenticated";

revoke truncate on table "public"."upload_chunks" from "authenticated";

revoke delete on table "public"."upload_chunks" from "service_role";

revoke insert on table "public"."upload_chunks" from "service_role";

revoke references on table "public"."upload_chunks" from "service_role";

revoke select on table "public"."upload_chunks" from "service_role";

revoke trigger on table "public"."upload_chunks" from "service_role";

revoke truncate on table "public"."upload_chunks" from "service_role";

revoke update on table "public"."upload_chunks" from "service_role";

revoke delete on table "public"."upload_sessions" from "anon";

revoke insert on table "public"."upload_sessions" from "anon";

revoke references on table "public"."upload_sessions" from "anon";

revoke trigger on table "public"."upload_sessions" from "anon";

revoke truncate on table "public"."upload_sessions" from "anon";

revoke update on table "public"."upload_sessions" from "anon";

revoke references on table "public"."upload_sessions" from "authenticated";

revoke trigger on table "public"."upload_sessions" from "authenticated";

revoke truncate on table "public"."upload_sessions" from "authenticated";

revoke delete on table "public"."upload_sessions" from "service_role";

revoke insert on table "public"."upload_sessions" from "service_role";

revoke references on table "public"."upload_sessions" from "service_role";

revoke select on table "public"."upload_sessions" from "service_role";

revoke trigger on table "public"."upload_sessions" from "service_role";

revoke truncate on table "public"."upload_sessions" from "service_role";

revoke update on table "public"."upload_sessions" from "service_role";

revoke delete on table "public"."user_language_preferences" from "anon";

revoke insert on table "public"."user_language_preferences" from "anon";

revoke references on table "public"."user_language_preferences" from "anon";

revoke trigger on table "public"."user_language_preferences" from "anon";

revoke truncate on table "public"."user_language_preferences" from "anon";

revoke update on table "public"."user_language_preferences" from "anon";

revoke references on table "public"."user_language_preferences" from "authenticated";

revoke trigger on table "public"."user_language_preferences" from "authenticated";

revoke truncate on table "public"."user_language_preferences" from "authenticated";

revoke delete on table "public"."user_language_preferences" from "service_role";

revoke insert on table "public"."user_language_preferences" from "service_role";

revoke references on table "public"."user_language_preferences" from "service_role";

revoke select on table "public"."user_language_preferences" from "service_role";

revoke trigger on table "public"."user_language_preferences" from "service_role";

revoke truncate on table "public"."user_language_preferences" from "service_role";

revoke update on table "public"."user_language_preferences" from "service_role";

revoke delete on table "public"."user_progress" from "anon";

revoke insert on table "public"."user_progress" from "anon";

revoke references on table "public"."user_progress" from "anon";

revoke select on table "public"."user_progress" from "anon";

revoke trigger on table "public"."user_progress" from "anon";

revoke truncate on table "public"."user_progress" from "anon";

revoke update on table "public"."user_progress" from "anon";

revoke delete on table "public"."user_progress" from "service_role";

revoke insert on table "public"."user_progress" from "service_role";

revoke references on table "public"."user_progress" from "service_role";

revoke select on table "public"."user_progress" from "service_role";

revoke trigger on table "public"."user_progress" from "service_role";

revoke truncate on table "public"."user_progress" from "service_role";

revoke update on table "public"."user_progress" from "service_role";

revoke delete on table "public"."users" from "anon";

revoke insert on table "public"."users" from "anon";

revoke references on table "public"."users" from "anon";

revoke select on table "public"."users" from "anon";

revoke trigger on table "public"."users" from "anon";

revoke truncate on table "public"."users" from "anon";

revoke update on table "public"."users" from "anon";

revoke delete on table "public"."users" from "service_role";

revoke insert on table "public"."users" from "service_role";

revoke references on table "public"."users" from "service_role";

revoke select on table "public"."users" from "service_role";

revoke trigger on table "public"."users" from "service_role";

revoke truncate on table "public"."users" from "service_role";

revoke update on table "public"."users" from "service_role";

alter table "public"."generated_images" drop constraint "generated_images_user_id_fkey";

alter table "public"."image_processing_jobs" drop constraint "fk_image_processing_jobs_order_id";

alter table "public"."image_processing_jobs" drop constraint "fk_image_processing_jobs_upload_id";

alter table "public"."image_processing_jobs" drop constraint "fk_image_processing_jobs_user_id";

alter table "public"."style_options" drop constraint "style_options_category_key";

alter table "public"."upload_sessions" drop constraint "upload_sessions_user_id_fkey";

drop index if exists "public"."idx_image_processing_jobs_order_id";

drop index if exists "public"."style_options_category_key";

alter type "public"."flow_stage" rename to "flow_stage__old_version_to_be_dropped";

create type "public"."flow_stage" as enum ('shoot', 'payment', 'upload', 'review', 'dashboard');

alter table "public"."user_progress" alter column current_stage type "public"."flow_stage" using current_stage::text::"public"."flow_stage";

-- Handle completed_stages column conversion with default value handling
alter table "public"."user_progress" alter column completed_stages drop default;
alter table "public"."user_progress" alter column completed_stages type "public"."flow_stage"[] using completed_stages::text[]::"public"."flow_stage"[];
alter table "public"."user_progress" alter column completed_stages set default '{}'::flow_stage[];

alter table "public"."completed_user_journeys" alter column "created_at" drop not null;

alter table "public"."completed_user_journeys" alter column "updated_at" drop not null;

alter table "public"."generated_images" drop column "url";

alter table "public"."generated_images" drop column "user_id";

alter table "public"."generated_images" add column "storage_path" text not null;

alter table "public"."generated_images" add column "upload_id" uuid;

alter table "public"."generated_images" alter column "metadata" drop not null;

alter table "public"."images" alter column "created_at" drop not null;

alter table "public"."images" alter column "dimensions" drop default;

alter table "public"."images" alter column "quality_score" set default 0;

alter table "public"."orders" alter column "created_at" drop not null;

alter table "public"."orders" alter column "metadata" drop default;

alter table "public"."orders" alter column "metadata" drop not null;

alter table "public"."orders" alter column "updated_at" drop not null;

alter table "public"."sessions" alter column "created_at" drop not null;

alter table "public"."sessions" alter column "expires_at" drop not null;

alter table "public"."sessions" alter column "updated_at" drop not null;

alter table "public"."style_options" alter column "created_at" drop not null;

alter table "public"."style_options" alter column "updated_at" drop not null;

alter table "public"."styles" alter column "created_at" drop not null;

alter table "public"."styles" alter column "status" set default 'draft'::text;

alter table "public"."styles" alter column "updated_at" drop not null;

alter table "public"."upload_chunks" alter column "created_at" set default now();

alter table "public"."upload_chunks" alter column "updated_at" set default now();

alter table "public"."upload_sessions" alter column "created_at" set default now();

alter table "public"."upload_sessions" alter column "updated_at" set default now();

alter table "public"."user_language_preferences" alter column "created_at" set default now();

alter table "public"."user_language_preferences" alter column "created_at" drop not null;

alter table "public"."user_language_preferences" alter column "updated_at" set default now();

alter table "public"."user_language_preferences" alter column "updated_at" drop not null;

alter table "public"."user_progress" alter column "created_at" drop not null;

alter table "public"."user_progress" alter column "last_active_at" drop not null;

alter table "public"."user_progress" alter column "stage_data" drop default;

alter table "public"."user_progress" alter column "updated_at" drop not null;

alter table "public"."users" alter column "created_at" drop not null;

alter table "public"."users" alter column "email" set not null;

alter table "public"."users" alter column "height" set data type integer using "height"::integer;

alter table "public"."users" alter column "updated_at" drop not null;

alter table "public"."users" alter column "weight" set data type integer using "weight"::integer;

CREATE INDEX idx_generated_images_status ON public.generated_images USING btree (status);

CREATE INDEX idx_generated_images_style_id ON public.generated_images USING btree (style_id);

CREATE INDEX idx_generated_images_upload_id ON public.generated_images USING btree (upload_id);

CREATE UNIQUE INDEX style_options_category_unique ON public.style_options USING btree (category);

alter table "public"."generated_images" add constraint "generated_images_status_check" CHECK ((status = ANY (ARRAY['processing'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."generated_images" validate constraint "generated_images_status_check";

alter table "public"."generated_images" add constraint "generated_images_upload_id_fkey" FOREIGN KEY (upload_id) REFERENCES images(id) ON DELETE SET NULL not valid;

alter table "public"."generated_images" validate constraint "generated_images_upload_id_fkey";

alter table "public"."image_processing_jobs" add constraint "image_processing_jobs_status_check" CHECK ((status = ANY (ARRAY['queued'::text, 'processing'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."image_processing_jobs" validate constraint "image_processing_jobs_status_check";

alter table "public"."image_processing_jobs" add constraint "image_processing_jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."image_processing_jobs" validate constraint "image_processing_jobs_user_id_fkey";

alter table "public"."style_options" add constraint "style_options_category_unique" UNIQUE using index "style_options_category_unique";

alter table "public"."upload_chunks" add constraint "upload_chunks_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'uploaded'::text]))) not valid;

alter table "public"."upload_chunks" validate constraint "upload_chunks_status_check";

alter table "public"."upload_sessions" add constraint "upload_sessions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."upload_sessions" validate constraint "upload_sessions_status_check";

alter table "public"."upload_sessions" add constraint "upload_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."upload_sessions" validate constraint "upload_sessions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.array_distinct(arr anyarray)
 RETURNS anyarray
 LANGUAGE plpgsql
 IMMUTABLE PARALLEL SAFE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.array_distinct(arr text[])
 RETURNS text[]
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN ARRAY(SELECT DISTINCT unnest(arr));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_or_update_user_progress(p_user_id uuid, p_current_stage text, p_completed_stages text[], p_stage_data jsonb DEFAULT '{}'::jsonb)
 RETURNS SETOF user_progress
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Verify the user can only update their own progress
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Insert or update the progress with explicit casting
  RETURN QUERY
  INSERT INTO public.user_progress (
    user_id,
    current_stage,
    completed_stages,
    stage_data,
    last_active_at
  )
  VALUES (
    p_user_id,
    p_current_stage::flow_stage,
    array_distinct(p_completed_stages)::flow_stage[],
    p_stage_data,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    current_stage = EXCLUDED.current_stage,
    completed_stages = array_distinct(
      (user_progress.completed_stages || EXCLUDED.completed_stages)::text[]
    )::flow_stage[],
    stage_data = COALESCE(user_progress.stage_data, '{}'::jsonb) || EXCLUDED.stage_data,
    last_active_at = EXCLUDED.last_active_at
  RETURNING *;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

create policy "Users can view their own journeys"
on "public"."completed_user_journeys"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can create generated images"
on "public"."generated_images"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM styles s
  WHERE ((s.id = generated_images.style_id) AND (s.user_id = auth.uid())))));


create policy "Users can read their own generated images"
on "public"."generated_images"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM styles s
  WHERE ((s.id = generated_images.style_id) AND (s.user_id = auth.uid())))));


create policy "Users can update their own generated images"
on "public"."generated_images"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM styles s
  WHERE ((s.id = generated_images.style_id) AND (s.user_id = auth.uid())))));


create policy "Users can manage their own sessions"
on "public"."sessions"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Public read access"
on "public"."style_configs"
as permissive
for select
to anon, authenticated
using (true);


create policy "Public read access"
on "public"."style_options"
as permissive
for select
to anon, authenticated
using (true);


create policy "Enable realtime for users own styles"
on "public"."styles"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert chunks for their upload sessions"
on "public"."upload_chunks"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM upload_sessions
  WHERE ((upload_sessions.id = upload_chunks.session_id) AND (upload_sessions.user_id = auth.uid())))));


create policy "Users can update chunks for their upload sessions"
on "public"."upload_chunks"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM upload_sessions
  WHERE ((upload_sessions.id = upload_chunks.session_id) AND (upload_sessions.user_id = auth.uid())))));


create policy "Users can view chunks for their upload sessions"
on "public"."upload_chunks"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM upload_sessions
  WHERE ((upload_sessions.id = upload_chunks.session_id) AND (upload_sessions.user_id = auth.uid())))));


create policy "Users can insert their own upload sessions"
on "public"."upload_sessions"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own upload sessions"
on "public"."upload_sessions"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own upload sessions"
on "public"."upload_sessions"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own language preference"
on "public"."user_language_preferences"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can read their own language preference"
on "public"."user_language_preferences"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can update their own language preference"
on "public"."user_language_preferences"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can insert their own progress"
on "public"."user_progress"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own progress"
on "public"."user_progress"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Users can view their own progress"
on "public"."user_progress"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Allow insert during signup"
on "public"."users"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Users can update their own profile"
on "public"."users"
as permissive
for update
to public
using ((auth.uid() = id))
with check ((auth.uid() = id));


create policy "Users can view their own profile"
on "public"."users"
as permissive
for select
to authenticated
using ((auth.uid() = id));


create policy "Users can manage their own images"
on "public"."images"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can manage their own orders"
on "public"."orders"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Allow public read access to style_configs"
on "public"."style_configs"
as permissive
for select
to anon, authenticated
using (true);


create policy "Allow public read access to style_options"
on "public"."style_options"
as permissive
for select
to anon, authenticated
using (true);


create policy "Users can manage their own styles"
on "public"."styles"
as permissive
for all
to authenticated
using (((auth.uid() = user_id) OR (auth.uid() = ( SELECT orders.user_id
   FROM orders
  WHERE (orders.id = styles.order_id)))))
with check (((auth.uid() = user_id) OR (auth.uid() = ( SELECT orders.user_id
   FROM orders
  WHERE (orders.id = styles.order_id)))));


create policy "Users can manage their own progress"
on "public"."user_progress"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


CREATE TRIGGER update_image_processing_jobs_updated_at BEFORE UPDATE ON public.image_processing_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Drop the old enum type after all references have been updated
drop type "public"."flow_stage__old_version_to_be_dropped";


