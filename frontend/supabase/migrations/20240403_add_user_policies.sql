-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role to create users during auth
CREATE POLICY "Enable insert for authentication" ON public.users
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = id);

-- Allow service role to upsert users during auth
CREATE POLICY "Enable upsert for authentication" ON public.users
  FOR UPDATE USING (auth.role() = 'service_role' OR auth.uid() = id); 