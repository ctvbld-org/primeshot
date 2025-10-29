-- Allow authenticated admins to read waitlist entries
-- RLS is enabled on public.waitlist; previously only insert was allowed

create policy "Admins can read waitlist"
on "public"."waitlist"
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.admin = true
  )
);


