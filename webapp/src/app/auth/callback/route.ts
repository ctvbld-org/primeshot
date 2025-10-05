import { NextResponse } from 'next/server'
import { createServerServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  // Use the configured app URL instead of request origin to handle domain rewrites
  const origin = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin

  if (code) {
    const cookieStore = await cookies()
    const supabase = await createServerServiceClient()

    try {
      // Exchange the code for a session using the service role client
      const { error: authError } = await supabase.auth.exchangeCodeForSession(code)
      if (authError) throw authError

      // Get user after exchange
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      console.log('OAuth User Data:', {
        id: user?.id,
        email: user?.email,
        user_metadata: user?.user_metadata,
        app_metadata: user?.app_metadata
      })

      if (user) {
        // User creation is now handled automatically by the database trigger
        // No need to manually create/update user in database
        
        // Create a new response with the redirect
        const app_url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        const response = NextResponse.redirect(new URL(app_url))
        
        // Copy over the cookies from the cookie store
        const allCookies = cookieStore.getAll()
        allCookies.forEach(cookie => {
          response.cookies.set(cookie.name, cookie.value)
        })

        return response
      }
      
      // If no user, redirect to home
      return NextResponse.redirect(new URL(origin))
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}${'/'}auth/auth-code-error`)
    }
  }

  return NextResponse.redirect(new URL(origin))
} 