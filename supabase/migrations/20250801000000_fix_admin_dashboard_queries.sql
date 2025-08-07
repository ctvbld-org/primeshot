-- Migration: Fix admin dashboard queries and relationships
-- Date: 2025-01-16
-- Purpose: Add missing RPC functions and fix foreign key relationships for admin dashboard

-- 1. Create get_top_users_by_generations RPC function
CREATE OR REPLACE FUNCTION public.get_top_users_by_generations(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  generation_count bigint,
  training_count bigint,
  subscription_plan text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.avatar_url,
    COUNT(DISTINCT ij.id) as generation_count,
    COUNT(DISTINCT tj.id) as training_count,
    us.plan_name as subscription_plan
  FROM public.users u
  LEFT JOIN public.inference_jobs ij ON u.id = ij.user_id
  LEFT JOIN public.training_jobs tj ON u.id = tj.user_id
  LEFT JOIN public.user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
  GROUP BY u.id, u.email, u.full_name, u.avatar_url, us.plan_name
  ORDER BY generation_count DESC, training_count DESC
  LIMIT limit_count;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_top_users_by_generations(integer) TO authenticated;

-- 2. Ensure foreign keys point to public.users instead of auth.users where needed
-- Check and fix inference_jobs foreign key if needed
DO $$
BEGIN
  -- Check if inference_jobs.user_id references auth.users
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu USING (constraint_name)
    WHERE tc.table_name = 'inference_jobs' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'users'
    AND ccu.table_schema = 'auth'
  ) THEN
    -- Drop the old constraint
    ALTER TABLE public.inference_jobs 
    DROP CONSTRAINT IF EXISTS inference_jobs_user_id_fkey;
    
    -- Add new constraint pointing to public.users
    ALTER TABLE public.inference_jobs
    ADD CONSTRAINT inference_jobs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Check and fix training_jobs foreign key if needed
DO $$
BEGIN
  -- Check if training_jobs.user_id references auth.users
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu USING (constraint_name)
    WHERE tc.table_name = 'training_jobs' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'users'
    AND ccu.table_schema = 'auth'
  ) THEN
    -- Drop the old constraint
    ALTER TABLE public.training_jobs 
    DROP CONSTRAINT IF EXISTS training_jobs_user_id_fkey;
    
    -- Add new constraint pointing to public.users
    ALTER TABLE public.training_jobs
    ADD CONSTRAINT training_jobs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Check and fix face_models foreign key if needed
DO $$
BEGIN
  -- Check if face_models.user_id references auth.users
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu USING (constraint_name)
    WHERE tc.table_name = 'face_models' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'users'
    AND ccu.table_schema = 'auth'
  ) THEN
    -- Drop the old constraint
    ALTER TABLE public.face_models 
    DROP CONSTRAINT IF EXISTS face_models_user_id_fkey;
    
    -- Add new constraint pointing to public.users
    ALTER TABLE public.face_models
    ADD CONSTRAINT face_models_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Create a simpler query function for revenue analytics that doesn't rely on complex joins
CREATE OR REPLACE FUNCTION public.get_revenue_data(
  start_date timestamptz,
  end_date timestamptz
)
RETURNS TABLE (
  subscription_revenue numeric,
  credit_pack_revenue numeric,
  refund_amount numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(
      (SELECT SUM(
        CASE 
          WHEN s.monthly_price IS NOT NULL THEN s.monthly_price * 100
          ELSE 0
        END
      )
      FROM public.user_subscriptions us
      JOIN public.subscriptions s ON us.plan_name = s.name
      WHERE us.status = 'active' 
      AND us.created_at >= start_date 
      AND us.created_at <= end_date), 0
    ) as subscription_revenue,
    
    COALESCE(
      (SELECT SUM(amount_paid)
      FROM public.credit_pack_purchases
      WHERE status = 'completed'
      AND created_at >= start_date 
      AND created_at <= end_date), 0
    ) as credit_pack_revenue,
    
    COALESCE(
      (SELECT SUM(ABS(credits) * 100)
      FROM public.user_credits
      WHERE transaction_type = 'refunded'
      AND created_at >= start_date 
      AND created_at <= end_date), 0
    ) as refund_amount;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_revenue_data(timestamptz, timestamptz) TO authenticated;

-- 4. Add comments for clarity
COMMENT ON FUNCTION public.get_top_users_by_generations(integer) IS 'Returns top users by number of image generations with their stats';
COMMENT ON FUNCTION public.get_revenue_data(timestamptz, timestamptz) IS 'Returns revenue data for a given date range including subscriptions, credit packs, and refunds'; 