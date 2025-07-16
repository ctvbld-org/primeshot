import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

async function getCookieConfig() {
  const cookieStore = await cookies()
  
  return {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: any) {
        try {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  }
}

/**
 * Creates a Supabase server client with user context (anon key + cookies)
 * Use this for server operations that respect RLS and user permissions
 */
export async function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    await getCookieConfig()
  )
}

/**
 * Creates a Supabase client with service role key for server-to-server operations
 * Use this for webhooks, background jobs, and other operations that don't need user context
 */
export function createServiceClient() {
  console.log('Creating service client with:')
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Service role key (first 10 chars):', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10))
  
  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  console.log('Service client created successfully')
  return client
}

/**
 * Creates a Supabase server client with service role key and cookie support
 * Use this for auth callbacks and other server operations that need cookie handling
 */
export async function createServerServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    await getCookieConfig()
  )
}