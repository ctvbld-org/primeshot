-- Add DELETE RLS policy for generated_images table
-- This allows authenticated users to delete their own generated images

create policy "users_can_delete_own_images"
on "public"."generated_images"
as permissive
for delete
to authenticated
using (auth.uid() = user_id);

-- Add comment to document the policy
COMMENT ON POLICY "users_can_delete_own_images" ON "public"."generated_images" 
IS 'Allows authenticated users to delete their own generated images';



