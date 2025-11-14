-- Add RLS policies to allow admin users to view all data in the admin dashboard
-- Admins are users with admin = true in the public.users table
-- 
-- This migration uses a SECURITY DEFINER function to avoid infinite recursion
-- when checking admin status within RLS policies

-- Create a SECURITY DEFINER function to check if the current user is an admin
-- This function bypasses RLS and prevents infinite recursion when used in policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
    AND admin = true
  );
$$;

-- Policy for users table: Allow admins to view all users
CREATE POLICY "Admins can view all users"
ON "public"."users"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (is_admin());

-- Policy for user_subscriptions table: Allow admins to view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON "public"."user_subscriptions"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (is_admin());

-- Policy for inference_jobs table: Allow admins to view all inference jobs
CREATE POLICY "Admins can view all inference jobs"
ON "public"."inference_jobs"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (is_admin());

-- Policy for training_jobs table: Allow admins to view all training jobs
CREATE POLICY "Admins can view all training jobs"
ON "public"."training_jobs"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (is_admin());

-- Policy for credit_pack_purchases table: Allow admins to view all credit pack purchases
CREATE POLICY "Admins can view all credit pack purchases"
ON "public"."credit_pack_purchases"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (is_admin());

-- Policy for user_credits table: Allow admins to view all user credits
CREATE POLICY "Admins can view all user credits"
ON "public"."user_credits"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (is_admin());

-- Note: subscriptions table already has "Users can view subscriptions" policy
-- which allows all users to view subscription plans (pricing info), so no additional policy needed

