-- Fix concurrency issue in assign_shoot_number function for first-time users
-- This migration replaces the FOR UPDATE approach with advisory locks
-- to prevent race conditions even when no rows exist for a user

-- Update the function to use advisory locks
CREATE OR REPLACE FUNCTION public.assign_shoot_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  user_id_hash BIGINT;
BEGIN
  -- Convert user_id UUID to a bigint for advisory lock
  -- Using the same hash consistently for the same user_id
  user_id_hash := ('x' || md5(NEW.user_id::text))::bit(64)::bigint;
  
  -- Acquire an advisory lock specific to this user_id
  -- This serializes all shoot number assignments for the same user,
  -- even when no orders exist yet
  PERFORM pg_advisory_xact_lock(user_id_hash);
  
  -- Find the highest shoot_number for this user and increment by 1
  -- No need for FOR UPDATE now since we have an advisory lock
  SELECT COALESCE(MAX(shoot_number), 0) + 1 INTO next_number
  FROM public.orders
  WHERE user_id = NEW.user_id;
  
  -- Assign the next number to the new order
  NEW.shoot_number := next_number;
  
  -- Advisory lock is automatically released at transaction end
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comment on the function to explain the concurrency protection
COMMENT ON FUNCTION public.assign_shoot_number IS 'Assigns sequential shoot numbers to orders per user with concurrency protection using advisory locks to handle first-time users'; 