-- Migration: Add Free Plan Auto-Assignment
-- Description: Automatically assigns Free plan to new users on signup and when subscriptions are cancelled
-- Date: 2025-11-17

-- ============================================================================
-- 1. Function to assign Free plan to a user
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_free_plan_to_user(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_existing_subscription_id UUID;
  v_new_subscription_id UUID;
  v_current_time TIMESTAMPTZ := NOW();
  v_free_plan_credits INTEGER;
BEGIN
  -- Look up credits from subscriptions table
  SELECT credits INTO v_free_plan_credits
  FROM subscriptions
  WHERE name = 'free';

  IF v_free_plan_credits IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', 'Free plan not found in subscriptions table'
    );
  END IF;

  -- Check if user already has an active subscription
  SELECT id INTO v_existing_subscription_id
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  LIMIT 1;

  -- If user already has an active subscription, skip
  IF v_existing_subscription_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'skipped',
      'message', 'User already has an active subscription',
      'existing_subscription_id', v_existing_subscription_id
    );
  END IF;

  -- Create Free plan subscription for the user
  INSERT INTO user_subscriptions (
    user_id,
    plan_name,
    status,
    stripe_subscription_id,
    stripe_customer_id,
    stripe_price_id,
    monthly_credits_quota,
    current_period_credits_used,
    current_period_start,
    current_period_end,
    last_quota_reset_at,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    'free',
    'active',
    NULL, -- No Stripe subscription for free plan
    NULL, -- No Stripe customer for free plan
    NULL, -- No Stripe price for free plan
    v_free_plan_credits, -- Credits from subscriptions table
    0, -- Start with 0 credits used
    v_current_time,
    v_current_time + INTERVAL '1 month', -- Period ends in 1 month
    v_current_time,
    v_current_time,
    v_current_time
  )
  RETURNING id INTO v_new_subscription_id;

  -- Award initial credits to the user (from subscriptions table)
  INSERT INTO user_credits (
    user_id,
    credits,
    transaction_type,
    source_type,
    source_id,
    expires_at,
    description,
    metadata
  )
  VALUES (
    p_user_id,
    v_free_plan_credits, -- Credits from subscriptions table
    'earned',
    'subscription',
    v_new_subscription_id::TEXT,
    v_current_time + INTERVAL '1 month', -- Credits expire at end of period
    'Free plan initial credits',
    jsonb_build_object(
      'plan_name', 'free',
      'allocation_type', 'initial',
      'period_start', v_current_time,
      'period_end', v_current_time + INTERVAL '1 month'
    )
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Free plan assigned successfully',
    'subscription_id', v_new_subscription_id,
    'credits_awarded', v_free_plan_credits
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION assign_free_plan_to_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_free_plan_to_user(UUID) TO service_role;

COMMENT ON FUNCTION assign_free_plan_to_user(UUID) IS 
'Assigns Free plan to a user with 10 monthly credits. Skips if user already has active subscription.';

-- ============================================================================
-- 2. Function to switch cancelled subscription to Free plan
-- ============================================================================

CREATE OR REPLACE FUNCTION switch_to_free_plan_on_cancellation(p_stripe_subscription_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Get user_id from the cancelled subscription
  SELECT user_id INTO v_user_id
  FROM user_subscriptions
  WHERE stripe_subscription_id = p_stripe_subscription_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', 'Subscription not found'
    );
  END IF;

  -- Mark the old subscription as cancelled (keep for history)
  UPDATE user_subscriptions
  SET 
    status = 'canceled',
    cancel_at_period_end = false,
    updated_at = NOW()
  WHERE stripe_subscription_id = p_stripe_subscription_id;

  -- Assign Free plan to the user
  SELECT assign_free_plan_to_user(v_user_id) INTO v_result;

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Switched to free plan',
    'user_id', v_user_id,
    'free_plan_result', v_result
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION switch_to_free_plan_on_cancellation(TEXT) TO service_role;

COMMENT ON FUNCTION switch_to_free_plan_on_cancellation(TEXT) IS 
'Switches a cancelled Stripe subscription to Free plan, called from webhook handler.';

-- ============================================================================
-- 3. Update handle_new_user to include Free plan assignment
-- ============================================================================

-- Update the main handle_new_user function to include Free plan assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _full_name text;
  _avatar_url text;
  _preferred_language text;
  _free_plan_result jsonb;
BEGIN
  -- Log the start
  RAISE LOG 'handle_new_user: START for user ID: %, email: %', NEW.id, NEW.email;
  
  -- Extract metadata
  _full_name := coalesce(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    nullif(concat(
      coalesce(NEW.raw_user_meta_data->>'given_name',''),
      ' ',
      coalesce(NEW.raw_user_meta_data->>'family_name','')
    ), ' '),
    NEW.raw_user_meta_data->>'user_name'
  );

  _avatar_url := coalesce(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );
  
  RAISE LOG 'handle_new_user: Extracted full_name: %, avatar_url: %', _full_name, _avatar_url;

  -- Insert into public.users
  RAISE LOG 'handle_new_user: Attempting insert into public.users';
  INSERT INTO public.users (
    id, email, full_name, avatar_url, created_at, updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    _full_name,
    _avatar_url,
    timezone('utc', now()),
    timezone('utc', now())
  );
  RAISE LOG 'handle_new_user: Successfully inserted into public.users';

  -- Initialize user_settings
  _preferred_language := coalesce(
    NEW.raw_user_meta_data->>'preferred_language',
    NEW.raw_user_meta_data->>'locale',
    'gb'  -- Default to 'gb' to match check constraint
  );
  
  RAISE LOG 'handle_new_user: Attempting insert into user_settings with language: %', _preferred_language;
  INSERT INTO public.user_settings (user_id, preferred_language, created_at, updated_at)
  VALUES (NEW.id, _preferred_language, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET
    preferred_language = excluded.preferred_language,
    updated_at = now();
  RAISE LOG 'handle_new_user: Successfully inserted into user_settings';

  -- Assign Free plan to the new user
  RAISE LOG 'handle_new_user: Attempting to assign Free plan';
  SELECT assign_free_plan_to_user(NEW.id) INTO _free_plan_result;
  RAISE LOG 'handle_new_user: Free plan assignment result: %', _free_plan_result;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block signup
  RAISE LOG 'handle_new_user ERROR for user ID %: %, SQLSTATE: %', 
    NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- Comment
COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger function that runs on new user signup. Creates public.users record, initializes user_settings, and assigns Free plan.';

