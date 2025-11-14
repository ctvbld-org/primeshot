-- Rollback migration: Remove broken admin RLS policies that cause infinite recursion
-- This removes the policies created by 20251114000000_add_admin_rls_policies.sql

DROP POLICY IF EXISTS "Admins can view all users" ON "public"."users";
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON "public"."user_subscriptions";
DROP POLICY IF EXISTS "Admins can view all inference jobs" ON "public"."inference_jobs";
DROP POLICY IF EXISTS "Admins can view all training jobs" ON "public"."training_jobs";
DROP POLICY IF EXISTS "Admins can view all credit pack purchases" ON "public"."credit_pack_purchases";
DROP POLICY IF EXISTS "Admins can view all user credits" ON "public"."user_credits";

