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
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Get user progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select()
      .eq('user_id', user.id)
      .single()

    // Define the order of stages for progression enforcement
    const stageOrder = ['shoot', 'payment', 'upload', 'review', 'dashboard'];
    
    // If progress exists (user has started the flow)
    if (progress) {
      const currentStageIndex = stageOrder.indexOf(progress.current_stage);
      
      // Get the stage the user is trying to access from the URL
      let targetStage = 'shoot'; // Default
      for (const stage of stageOrder) {
        if (request.nextUrl.pathname.includes(`/app/${stage}`)) {
          targetStage = stage;
          break;
        }
      }
      
      // Special case for style creation/editing
      const isStyleRoute = request.nextUrl.pathname === '/app/style' || 
                                request.nextUrl.pathname.startsWith('/app/style/');
      
      // If they're trying to access the style page but already proceeded to upload or beyond
      if (isStyleRoute && currentStageIndex > 0) {
        // Redirect them back to their current stage
        return NextResponse.redirect(new URL(`/app/${progress.current_stage}`, request.url));
      }
      
      // If trying to go to styles page but already in a later stage
      if (targetStage === 'styles' && currentStageIndex > 0) {
        // Redirect them back to their current stage
        return NextResponse.redirect(new URL(`/app/${progress.current_stage}`, request.url));
      }
      
      // Get target stage index
      const targetStageIndex = stageOrder.indexOf(targetStage);
      
      // Allow access only to current stage or previous completed stages
      // But prevent going beyond current stage
      if (targetStageIndex > currentStageIndex) {
        // They're trying to skip ahead
        return NextResponse.redirect(new URL(`/app/${progress.current_stage}`, request.url));
      }
    } 
    // If no progress exists, only allow access to styles or style creation
    else {
      const isShootRoute = request.nextUrl.pathname === '/app/shoot';
      const isStyleRoute = request.nextUrl.pathname === '/app/style' || 
                                request.nextUrl.pathname.startsWith('/app/style/');
                                
      if (!isShootRoute && !isStyleRoute) {
        return NextResponse.redirect(new URL('/app/shoot', request.url));
      }
    }
  }

  return response;
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