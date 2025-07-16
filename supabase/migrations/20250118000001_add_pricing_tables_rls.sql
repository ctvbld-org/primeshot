-- Enable RLS on pricing tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_costs ENABLE ROW LEVEL SECURITY;

-- Subscriptions table policies
-- Allow everyone to read subscription tiers (needed for pricing display)
CREATE POLICY "Anyone can read subscriptions" ON public.subscriptions
  FOR SELECT USING (true);

-- Only service_role can modify subscriptions (admin operations)
CREATE POLICY "Only service_role can insert subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service_role can update subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Only service_role can delete subscriptions" ON public.subscriptions
  FOR DELETE USING (auth.role() = 'service_role');

-- Credit packs table policies
-- Allow everyone to read credit packs (needed for purchase options)
CREATE POLICY "Anyone can read credit_packs" ON public.credit_packs
  FOR SELECT USING (true);

-- Only service_role can modify credit packs (admin operations)
CREATE POLICY "Only service_role can insert credit_packs" ON public.credit_packs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service_role can update credit_packs" ON public.credit_packs
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Only service_role can delete credit_packs" ON public.credit_packs
  FOR DELETE USING (auth.role() = 'service_role');

-- Credit costs table policies
-- Allow everyone to read credit costs (needed for pricing calculations)
CREATE POLICY "Anyone can read credit_costs" ON public.credit_costs
  FOR SELECT USING (true);

-- Only service_role can modify credit costs (admin operations)
CREATE POLICY "Only service_role can insert credit_costs" ON public.credit_costs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service_role can update credit_costs" ON public.credit_costs
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Only service_role can delete credit_costs" ON public.credit_costs
  FOR DELETE USING (auth.role() = 'service_role'); 