drop policy "Users can update their own data" on "public"."users";

create policy "Users can update their own data"
on "public"."users"
as permissive
for update
to public
using ((auth.uid() = id))
with check ((auth.uid() = id));



