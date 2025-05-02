import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Type alias for FlowStage to use in middleware
type FlowStage = 'shoot' | 'payment' | 'upload' | 'review' | 'dashboard';

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

    // Check if the current route is the profile settings page
    const isProfileSettingsPage = request.nextUrl.pathname === '/app/settings/profile';
    
    // If not on the profile settings page, check profile completion
    if (!isProfileSettingsPage) {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('full_name, gender')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Middleware: Error fetching user profile:', profileError);
        return response;
      }
      
      // If profile is incomplete, redirect to profile settings
      if (!profileData?.gender) {
        return NextResponse.redirect(new URL('/app/settings/profile', request.url))
      }
    }

    // Get user progress
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('current_stage, completed_stages')
      .eq('user_id', user.id)
      .limit(1)

    if (progressError) {
      console.error('Middleware: Error fetching user progress:', progressError);
      return response; 
    }
    
    const progress = progressData && progressData.length > 0 ? progressData[0] : null;

    // Define the order of stages for progression enforcement
    const stageOrder: FlowStage[] = ['shoot', 'payment', 'upload', 'review', 'dashboard'];
    
    // Helper to check if payment is completed
    const isPaymentCompleted = (progressRecord: typeof progress): boolean => {
      const completed = progressRecord?.completed_stages ?? [];
      // Check if 'payment' exists in the potentially mixed-type array
      return completed.includes('payment' as any); 
    }
    
    // If progress exists (user has started the flow)
    if (progress) {
      // Explicitly cast current_stage from the database (which might be text) to FlowStage
      const currentActualStage = (progress.current_stage || 'shoot');
      const currentStageIndex = stageOrder.indexOf(currentActualStage as FlowStage);
      
      // Get the stage the user is trying to access from the URL
      let targetStage = 'shoot'; // Default
      for (const stage of stageOrder) {
        if (request.nextUrl.pathname.includes(`/app/${stage}`)) {
          targetStage = stage;
          break;
        }
      }
      
      // Special handling for style routes (/app/styles)
      const isStyleRoute = request.nextUrl.pathname === '/app/styles' || 
                                request.nextUrl.pathname.startsWith('/app/styles/');
                                
      if (isStyleRoute) {
        // Allow access to style routes if payment is NOT completed
        if (!isPaymentCompleted(progress)) {
          return response; // Allow access
        } else {
          // If payment IS completed, redirect away from style routes to dashboard
          return NextResponse.redirect(new URL('/app/dashboard', request.url));
        }
      }
      
      // General stage access logic
      const targetStageIndex = stageOrder.indexOf(targetStage as FlowStage);
      
      // If payment IS completed, enforce strict sequential access
      if (isPaymentCompleted(progress)) {
        const maxCompletedIndex = Math.max(
          ...(progress.completed_stages || []).map((s: FlowStage) => stageOrder.indexOf(s)),
          -1
        );
        if (targetStageIndex > maxCompletedIndex + 1) {
          // Trying to skip ahead after payment
          return NextResponse.redirect(new URL(`/app/${currentActualStage}`, request.url));
        }
      } 
      // Before payment is completed, allow access to 'shoot' and 'payment'
      else {
        if (targetStage !== 'shoot' && targetStage !== 'payment') {
          // Trying to access upload/review/dashboard before payment
          return NextResponse.redirect(new URL('/app/payment', request.url));
        }
        // Allow access to shoot or payment freely
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