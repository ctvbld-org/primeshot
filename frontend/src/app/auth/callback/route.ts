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
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    try {
      // Exchange the code for a session using the service role client
      const { error: authError } = await supabase.auth.exchangeCodeForSession(code)
      if (authError) throw authError

      // Get user after exchange
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      if (user) {
        // Get user metadata from OAuth provider if available
        const full_name = user.user_metadata?.full_name || 
                         user.user_metadata?.name ||
                         user.user_metadata?.user_name ||
                         null

        const avatar_url = user.user_metadata?.avatar_url || null

        // Create/update user in database using same client (has service role permissions)
        const { error: dbError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            full_name,
            avatar_url,
            updated_at: new Date().toISOString()
          })
        if (dbError) {
          console.error('Error creating user in database:', dbError)
        }
      }
      
      // Create a new response with the redirect
      const response = NextResponse.redirect(new URL('/app', requestUrl.origin))
      
      // Copy over the cookies from the cookie store
      const allCookies = cookieStore.getAll()
      allCookies.forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value)
      })

      return response
    } catch (error) {
      return NextResponse.redirect(new URL('/auth/auth-code-error', requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/', request.url))
} 