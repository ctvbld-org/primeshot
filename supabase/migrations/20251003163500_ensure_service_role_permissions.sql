-- COMPREHENSIVE FIX: Service role permissions for Modal apps
-- This single migration fixes all permission issues preventing Modal apps from writing to database tables

-- Fix uploaded_images table permissions
GRANT ALL ON TABLE "public"."uploaded_images" TO "service_role";
DROP POLICY IF EXISTS "service_role_bypass_policy" ON "public"."uploaded_images";
CREATE POLICY "service_role_bypass_policy" ON "public"."uploaded_images" 
TO "service_role" 
USING (true) 
WITH CHECK (true);

-- Fix generated_images table permissions (ensure consistency)
GRANT ALL ON TABLE "public"."generated_images" TO "service_role";
DROP POLICY IF EXISTS "service_role_bypass_policy" ON "public"."generated_images";
CREATE POLICY "service_role_bypass_policy" ON "public"."generated_images" 
TO "service_role" 
USING (true) 
WITH CHECK (true);

-- Fix all other critical tables that Modal apps and Edge Functions need access to
GRANT ALL ON TABLE "public"."inference_jobs" TO "service_role";
GRANT ALL ON TABLE "public"."training_jobs" TO "service_role";
GRANT ALL ON TABLE "public"."characters" TO "service_role";
GRANT ALL ON TABLE "public"."user_credits" TO "service_role";
GRANT ALL ON TABLE "public"."credit_usage" TO "service_role";
