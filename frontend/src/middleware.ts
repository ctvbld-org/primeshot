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

    // Get current path for easier checks
    const currentPath = request.nextUrl.pathname;
    
    // Check if the current route is the profile settings page
    const isProfileSettingsPage = currentPath === '/app/settings/profile';
    
    // Get user profile first as it's needed for all flows
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('gender')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Middleware: Error fetching user profile:', profileError);
      return response;
    }

    // If profile is incomplete, only allow access to profile settings
    if (!profileData?.gender) {
      if (!isProfileSettingsPage) {
        return NextResponse.redirect(new URL('/app/settings/profile', request.url))
      }
      return response;
    }

    // Get user progress
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('current_stage, completed_stages, stage_data')
      .eq('user_id', user.id)
      .limit(1)

    if (progressError) {
      console.error('Middleware: Error fetching user progress:', progressError);
      return response;
    }

    const progress = progressData && progressData.length > 0 ? progressData[0] : null;
    const currentStage = progress?.current_stage || 'shoot';
    const completedStages = progress?.completed_stages || [];

    // Helper to check if payment is completed
    const isPaymentCompleted = completedStages.includes('payment');

    // Get user's styles count for payment access check
    const { count: stylesCount } = await supabase
      .from('styles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Define allowed paths based on current stage and flow rules
    if (!progress || currentStage === 'shoot') {
      // Initial flow - only allow shoot, style, and payment (if has styles)
      if (currentPath.startsWith('/app/upload') || 
          currentPath.startsWith('/app/review') || 
          currentPath.startsWith('/app/shoots')) {
        return NextResponse.redirect(new URL('/app/shoot', request.url));
      }
      
      // Block payment if no styles
      if (currentPath.startsWith('/app/payment') && (!stylesCount || stylesCount === 0)) {
        return NextResponse.redirect(new URL('/app/shoot', request.url));
      }
    }
    
    // After payment completed
    else if (isPaymentCompleted) {
      // Special case for payment success page
      if (currentPath === '/app/payment/success') {
        return response;
      }

      // If in upload stage
      if (currentStage === 'upload') {
        if (!currentPath.startsWith('/app/upload')) {
          return NextResponse.redirect(new URL('/app/upload', request.url));
        }
      }
      
      // If in review stage
      else if (currentStage === 'review') {
        if (!currentPath.startsWith('/app/review') && !currentPath.startsWith('/app/upload')) {
          return NextResponse.redirect(new URL('/app/review', request.url));
        }
      }
      
      // If in shoots stage (generation started)
      else if (currentStage === 'shoots') {
        if (!currentPath.startsWith('/app/shoots')) {
          return NextResponse.redirect(new URL('/app/shoots', request.url));
        }
      }
      
      // Block access to shoot, style, and payment pages after payment
      if (currentPath.startsWith('/app/shoot') || 
          currentPath.startsWith('/app/style') || 
          currentPath.startsWith('/app/payment')) {
        return NextResponse.redirect(new URL(`/app/${currentStage}`, request.url));
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