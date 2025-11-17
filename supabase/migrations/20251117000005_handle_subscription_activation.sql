-- Migration: Handle Subscription Activation and Cancel Old Subscriptions
-- This function atomically cancels all other active subscriptions when a new one is activated
-- Handles both paid subscriptions (with Stripe IDs) and Free plans (without Stripe IDs)

CREATE OR REPLACE FUNCTION handle_subscription_activation(
  p_user_id UUID,
  p_new_stripe_subscription_id TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_canceled_count INTEGER := 0;
  v_canceled_subscriptions jsonb := '[]'::jsonb;
  v_subscription RECORD;
BEGIN
  -- Find all active subscriptions for this user EXCEPT the new one
  FOR v_subscription IN
    SELECT id, stripe_subscription_id, plan_name, status
    FROM user_subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND (
        -- Include Free plans (NULL stripe_subscription_id)
        stripe_subscription_id IS NULL
        OR 
        -- Include other paid plans (but not the new one)
        stripe_subscription_id != p_new_stripe_subscription_id
      )
  LOOP
    -- Cancel the old subscription
    UPDATE user_subscriptions
    SET 
      status = 'canceled',
      updated_at = NOW()
    WHERE id = v_subscription.id;
    
    v_canceled_count := v_canceled_count + 1;
    
    -- Track what we canceled
    v_canceled_subscriptions := v_canceled_subscriptions || jsonb_build_object(
      'id', v_subscription.id,
      'plan_name', v_subscription.plan_name,
      'stripe_subscription_id', v_subscription.stripe_subscription_id,
      'was_free_plan', v_subscription.stripe_subscription_id IS NULL
    );
    
    RAISE LOG 'Canceled subscription: % (plan: %, stripe_id: %)', 
      v_subscription.id, 
      v_subscription.plan_name, 
      COALESCE(v_subscription.stripe_subscription_id, 'FREE');
  END LOOP;
  
  -- Return summary
  RETURN jsonb_build_object(
    'status', 'success',
    'canceled_count', v_canceled_count,
    'canceled_subscriptions', v_canceled_subscriptions,
    'message', format('Canceled %s old subscription(s) for user %s', v_canceled_count, p_user_id)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_subscription_activation: %', SQLERRM;
    RETURN jsonb_build_object(
      'status', 'error',
      'message', SQLERRM
    );
END;
$$;

-- Add comment
COMMENT ON FUNCTION handle_subscription_activation IS 
  'Atomically cancels all other active subscriptions (including Free plans) when a new subscription is activated. Returns list of canceled subscriptions.';

