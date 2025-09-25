import { NextResponse } from 'next/server'
import { createServerServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH

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

      if (user) {
        // Get user metadata from OAuth provider if available
        const full_name = user.user_metadata?.name || 
                         user.user_metadata?.full_name ||
                         `${user.user_metadata?.given_name || ''} ${user.user_metadata?.family_name || ''}`.trim() ||
                         user.user_metadata?.user_name ||
                         null

        const avatar_url = user.user_metadata?.picture || user.user_metadata?.avatar_url || null

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

        // Create a new response with the redirect
        const targetPath = (basePath || '/')
        const app_url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        const response = NextResponse.redirect(new URL(targetPath, app_url))
        
        // Copy over the cookies from the cookie store
        const allCookies = cookieStore.getAll()
        allCookies.forEach(cookie => {
          response.cookies.set(cookie.name, cookie.value)
        })

        return response
      }
      
      // If no user, redirect to home
      return NextResponse.redirect(new URL(basePath || '/', requestUrl.origin))
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}${basePath || '/'}auth/auth-code-error`)
    }
  }

  return NextResponse.redirect(`${origin}${basePath || '/'}`)
} 