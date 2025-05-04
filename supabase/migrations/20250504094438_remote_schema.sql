drop policy "Allow public read access to style_configs" on "public"."style_configs";

drop policy "Allow public read access to style_options" on "public"."style_options";

drop policy "Users can insert their own language preference" on "public"."user_language_preferences";

drop policy "Users can read their own language preference" on "public"."user_language_preferences";

drop policy "Users can update their own language preference" on "public"."user_language_preferences";

revoke delete on table "public"."completed_user_journeys" from "service_role";

revoke insert on table "public"."completed_user_journeys" from "service_role";

revoke references on table "public"."completed_user_journeys" from "service_role";

revoke select on table "public"."completed_user_journeys" from "service_role";

revoke trigger on table "public"."completed_user_journeys" from "service_role";

revoke truncate on table "public"."completed_user_journeys" from "service_role";

revoke update on table "public"."completed_user_journeys" from "service_role";

revoke delete on table "public"."images" from "service_role";

revoke insert on table "public"."images" from "service_role";

revoke references on table "public"."images" from "service_role";

revoke select on table "public"."images" from "service_role";

revoke trigger on table "public"."images" from "service_role";

revoke truncate on table "public"."images" from "service_role";

revoke update on table "public"."images" from "service_role";

revoke delete on table "public"."orders" from "service_role";

revoke insert on table "public"."orders" from "service_role";

revoke references on table "public"."orders" from "service_role";

revoke select on table "public"."orders" from "service_role";

revoke trigger on table "public"."orders" from "service_role";

revoke truncate on table "public"."orders" from "service_role";

revoke update on table "public"."orders" from "service_role";

revoke delete on table "public"."sessions" from "service_role";

revoke insert on table "public"."sessions" from "service_role";

revoke references on table "public"."sessions" from "service_role";

revoke select on table "public"."sessions" from "service_role";

revoke trigger on table "public"."sessions" from "service_role";

revoke truncate on table "public"."sessions" from "service_role";

revoke update on table "public"."sessions" from "service_role";

revoke delete on table "public"."style_configs" from "service_role";

revoke insert on table "public"."style_configs" from "service_role";

revoke references on table "public"."style_configs" from "service_role";

revoke select on table "public"."style_configs" from "service_role";

revoke trigger on table "public"."style_configs" from "service_role";

revoke truncate on table "public"."style_configs" from "service_role";

revoke update on table "public"."style_configs" from "service_role";

revoke delete on table "public"."style_options" from "service_role";

revoke insert on table "public"."style_options" from "service_role";

revoke references on table "public"."style_options" from "service_role";

revoke select on table "public"."style_options" from "service_role";

revoke trigger on table "public"."style_options" from "service_role";

revoke truncate on table "public"."style_options" from "service_role";

revoke update on table "public"."style_options" from "service_role";

revoke delete on table "public"."styles" from "service_role";

revoke insert on table "public"."styles" from "service_role";

revoke references on table "public"."styles" from "service_role";

revoke select on table "public"."styles" from "service_role";

revoke trigger on table "public"."styles" from "service_role";

revoke truncate on table "public"."styles" from "service_role";

revoke update on table "public"."styles" from "service_role";

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

revoke delete on table "public"."user_progress" from "service_role";

revoke insert on table "public"."user_progress" from "service_role";

revoke references on table "public"."user_progress" from "service_role";

revoke select on table "public"."user_progress" from "service_role";

revoke trigger on table "public"."user_progress" from "service_role";

revoke truncate on table "public"."user_progress" from "service_role";

revoke update on table "public"."user_progress" from "service_role";

revoke delete on table "public"."users" from "service_role";

revoke insert on table "public"."users" from "service_role";

revoke references on table "public"."users" from "service_role";

revoke select on table "public"."users" from "service_role";

revoke trigger on table "public"."users" from "service_role";

revoke truncate on table "public"."users" from "service_role";

revoke update on table "public"."users" from "service_role";

alter table "public"."users" drop constraint "users_id_fkey";

alter table "public"."sessions" alter column "expires_at" drop not null;

alter table "public"."styles" alter column "settings" set default '{}'::jsonb;

alter table "public"."styles" alter column "status" set default 'draft'::text;

alter table "public"."users" alter column "email" set not null;

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

grant select on table "public"."user_language_preferences" to "anon";

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



