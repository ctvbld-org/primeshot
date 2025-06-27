import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client for the marketing site
// Uses Service Role key so it can insert into the `waitlist` table securely.
// Never expose this key to the browser – this module must only be imported in server code.

export const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) 