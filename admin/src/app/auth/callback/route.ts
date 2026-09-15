import { NextResponse } from 'next/server'
import { createServerServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

function adminUrl(origin: string, path: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  return new URL(`${basePath}${path}`, origin)
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = await cookies()
    const supabase = await createServerServiceClient()

    try {
      const { error: authError } = await supabase.auth.exchangeCodeForSession(code)
      if (authError) throw authError

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      if (user) {
        const response = NextResponse.redirect(adminUrl(origin, '/dashboard'))

        const allCookies = cookieStore.getAll()
        allCookies.forEach(cookie => {
          response.cookies.set(cookie.name, cookie.value)
        })

        return response
      }

      return NextResponse.redirect(adminUrl(origin, '/'))
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(adminUrl(origin, '/auth/auth-code-error'))
    }
  }

  return NextResponse.redirect(adminUrl(origin, '/'))
}
