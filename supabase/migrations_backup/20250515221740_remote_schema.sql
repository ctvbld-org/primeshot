drop policy "Users can delete chunks for their upload sessions" on "public"."upload_chunks";

drop policy "Users can delete their own upload sessions" on "public"."upload_sessions";

drop policy "Users can update their own profile" on "public"."users";

revoke delete on table "public"."upload_chunks" from "service_role";

revoke insert on table "public"."upload_chunks" from "service_role";

revoke references on table "public"."upload_chunks" from "service_role";

revoke select on table "public"."upload_chunks" from "service_role";

revoke trigger on table "public"."upload_chunks" from "service_role";

revoke truncate on table "public"."upload_chunks" from "service_role";

revoke update on table "public"."upload_chunks" from "service_role";

revoke delete on table "public"."upload_sessions" from "service_role";

revoke insert on table "public"."upload_sessions" from "service_role";

revoke references on table "public"."upload_sessions" from "service_role";

revoke select on table "public"."upload_sessions" from "service_role";

revoke trigger on table "public"."upload_sessions" from "service_role";

revoke truncate on table "public"."upload_sessions" from "service_role";

revoke update on table "public"."upload_sessions" from "service_role";

alter type "public"."flow_stage" rename to "flow_stage__old_version_to_be_dropped";

create type "public"."flow_stage" as enum ('shoot', 'payment', 'upload', 'review', 'dashboard');

alter table "public"."user_progress" alter column current_stage type "public"."flow_stage" using current_stage::text::"public"."flow_stage";

drop type "public"."flow_stage__old_version_to_be_dropped";

alter table "public"."images" alter column "quality_score" set default 0;

alter table "public"."images" alter column "quality_score" set data type double precision using "quality_score"::double precision;

alter table "public"."users" add column "age" integer;

alter table "public"."users" add column "body_type" text;

alter table "public"."users" add column "ethnicity" text;

alter table "public"."users" add column "eye_color" text;

alter table "public"."users" add column "glasses" boolean;

alter table "public"."users" add column "hair_color" text;

alter table "public"."users" add column "hair_length" text;

alter table "public"."users" add column "hair_style" text;

alter table "public"."users" add column "height" integer;

alter table "public"."users" add column "weight" integer;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant select on table "public"."upload_chunks" to "anon";

grant select on table "public"."upload_sessions" to "anon";

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


create policy "Users can update their own profile"
on "public"."users"
as permissive
for update
to public
using ((auth.uid() = id))
with check ((auth.uid() = id));


CREATE TRIGGER user_progress_updated_at BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


