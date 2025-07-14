drop policy "Users can update their own profile" on "public"."users";

alter table "public"."users" add column "admin" boolean not null default false;

create policy "Service role full access to users"
on "public"."users"
as permissive
for all
to service_role
using (true)
with check (true);


create policy "Users can update their own profile (except admin)"
on "public"."users"
as permissive
for update
to public
using ((auth.uid() = id))
with check (((auth.uid() = id) AND (admin = ( SELECT users_1.admin
   FROM users users_1
  WHERE (users_1.id = auth.uid())))));



