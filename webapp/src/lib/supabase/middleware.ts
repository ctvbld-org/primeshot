import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set cookies on request (for edge middleware)
            request.cookies.set({
              name,
              value,
              ...options
            })
            
            // Set cookies on response (for client)
            response.cookies.set({
              name,
              value,
              ...options
            })
          })
          
          // Create new response using the updated request
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
        },
      },
    }
  )

  // Refresh session if expired
  await supabase.auth.getUser()

  return response
}