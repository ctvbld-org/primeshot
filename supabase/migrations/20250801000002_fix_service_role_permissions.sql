-- Grant minimal service_role permissions for admin sync functionality (read-only for comparison)
-- Only SELECT is needed for sync comparison, INSERT/UPDATE/DELETE for actual sync operations

-- Styles table permissions
GRANT SELECT ON TABLE public.styles TO service_role;
GRANT INSERT, UPDATE, DELETE ON TABLE public.styles TO service_role; -- Needed for sync operations

-- Subscriptions table permissions  
GRANT SELECT ON TABLE public.subscriptions TO service_role;
GRANT INSERT, UPDATE, DELETE ON TABLE public.subscriptions TO service_role; -- Needed for sync operations

-- Credit packs table permissions
GRANT SELECT ON TABLE public.credit_packs TO service_role;
GRANT INSERT, UPDATE, DELETE ON TABLE public.credit_packs TO service_role; -- Needed for sync operations

-- Credit costs table permissions
GRANT SELECT ON TABLE public.credit_costs TO service_role;
GRANT INSERT, UPDATE, DELETE ON TABLE public.credit_costs TO service_role; -- Needed for sync operations

-- Note: Avoiding TRUNCATE, REFERENCES, TRIGGER permissions unless specifically needed 