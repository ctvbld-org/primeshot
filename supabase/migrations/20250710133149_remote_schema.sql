drop policy "Users can insert their own upload sessions" on "public"."upload_sessions";

drop policy "Users can update their own upload sessions" on "public"."upload_sessions";

drop policy "Users can view their own upload sessions" on "public"."upload_sessions";

alter table "public"."upload_sessions" drop constraint "upload_sessions_order_id_fkey";

alter table "public"."upload_sessions" drop column "order_id";

alter table "public"."upload_sessions" add column "face_model_id" uuid;

CREATE INDEX idx_upload_sessions_face_model_id ON public.upload_sessions USING btree (face_model_id);

alter table "public"."upload_sessions" add constraint "upload_sessions_face_model_id_fkey" FOREIGN KEY (face_model_id) REFERENCES face_models(id) ON DELETE CASCADE not valid;

alter table "public"."upload_sessions" validate constraint "upload_sessions_face_model_id_fkey";

create policy "Users can insert their own upload sessions"
on "public"."upload_sessions"
as permissive
for insert
to public
with check (((auth.uid() = user_id) OR ((face_model_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM face_models
  WHERE ((face_models.id = upload_sessions.face_model_id) AND (face_models.user_id = auth.uid())))))));


create policy "Users can update their own upload sessions"
on "public"."upload_sessions"
as permissive
for update
to public
using (((auth.uid() = user_id) OR ((face_model_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM face_models
  WHERE ((face_models.id = upload_sessions.face_model_id) AND (face_models.user_id = auth.uid())))))));


create policy "Users can view their own upload sessions"
on "public"."upload_sessions"
as permissive
for select
to public
using (((auth.uid() = user_id) OR ((face_model_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM face_models
  WHERE ((face_models.id = upload_sessions.face_model_id) AND (face_models.user_id = auth.uid())))))));



