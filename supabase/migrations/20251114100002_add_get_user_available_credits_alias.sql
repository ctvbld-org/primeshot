-- ============================================================================
-- CRITICAL FIX: training-create calls get_user_available_credits but it doesn't exist!
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_available_credits(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT get_available_credits(user_uuid) INTO v_result;
  RETURN COALESCE((v_result->>'total')::INTEGER, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_available_credits(UUID) TO authenticated, service_role;



