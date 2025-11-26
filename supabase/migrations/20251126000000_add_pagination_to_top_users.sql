-- Add pagination support to get_top_users_by_generations function
CREATE OR REPLACE FUNCTION public.get_top_users_by_generations(
  limit_count integer DEFAULT 10,
  offset_count integer DEFAULT 0
)
 RETURNS TABLE(id uuid, email text, full_name text, avatar_url text, generation_count bigint, training_count bigint, subscription_plan text)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
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
  LIMIT limit_count
  OFFSET offset_count;
$function$
;

