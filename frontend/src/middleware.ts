import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Update session using our shared middleware function
  const response = await updateSession(request)

  // Create server client for additional checks
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        }
      }
    }
  )

  // Protect all routes under /app
  if (request.nextUrl.pathname.startsWith('/app')) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }

    // Get user progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select()
      .eq('user_id', user.id)
      .single()

    // If user hasn't completed payment, enforce stage progression
    if (progress && !progress.completed_stages.includes('payment')) {
      // Allow access only to compositions and current stage
      const isCompositionsRoute = request.nextUrl.pathname === '/app/compositions'
      const isCurrentStageRoute = request.nextUrl.pathname.includes(progress.current_stage)
      
      if (!isCompositionsRoute && !isCurrentStageRoute) {
        // Redirect to their current stage
        return NextResponse.redirect(
          new URL(`/app/${progress.current_stage}`, request.url)
        )
      }
    }

    // If no progress exists and not on compositions page, redirect to compositions
    if (
      !progress &&
      request.nextUrl.pathname !== '/app/compositions'
    ) {
      return NextResponse.redirect(
        new URL('/app/compositions', request.url)
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)'
  ]
}