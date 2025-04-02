import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            const allCookies = cookieStore.getAll()
            return allCookies.map((cookie: RequestCookie) => ({
              name: cookie.name,
              value: cookie.value
            }))
          },
          async setAll(cookiesToSet) {
            const cookieStore = await cookies()
            for (const cookie of cookiesToSet) {
              cookieStore.set(cookie.name, cookie.value, cookie.options)
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(new URL('/auth/auth-code-error', requestUrl.origin))
    }
    
    // Create a new response with the redirect
    const response = NextResponse.redirect(new URL('/app', requestUrl.origin))
    
    // Copy over the cookies from the cookie store
    const allCookies = cookieStore.getAll()
    allCookies.forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value)
    })

    return response
  }

  return NextResponse.redirect(new URL('/', request.url))
} 