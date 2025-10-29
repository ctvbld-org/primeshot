-- Fix service role permissions for Modal apps
-- This allows Modal apps to write to uploaded_images and generated_images tables

-- Grant permissions to service_role on uploaded_images table
GRANT ALL ON TABLE "public"."uploaded_images" TO "service_role";

-- Add service role bypass policy for uploaded_images table
CREATE POLICY "service_role_bypass_policy" ON "public"."uploaded_images" 
TO "service_role" 
USING (true) 
WITH CHECK (true);
