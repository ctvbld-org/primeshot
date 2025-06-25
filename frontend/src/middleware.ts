import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import { verifyPaymentHash } from '@/lib/server/hash-verification'

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

    // Special case: Check for upload page with session_id
    if (currentPath === '/app/upload') {
      const searchParams = request.nextUrl.searchParams;
      const sessionId = searchParams.get('session_id');
      const orderId = searchParams.get('order_id');
      const hash = searchParams.get('hash');

      if (sessionId && orderId && hash) {
        // First verify the hash
        const isValidHash = await verifyPaymentHash(sessionId, orderId, hash);
        if (!isValidHash) {
          console.error('Invalid payment hash detected');
          return NextResponse.redirect(new URL('/app/shoot', request.url));
        }

        // Verify the order and session
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('user_id', user.id)
          .eq('checkout_session_id', sessionId)
          .in('payment_status', ['checkout_started', 'pending_payment'])
          .single();

        if (!orderError && order) {
          // Valid order found, update user progress
          await supabase
            .from('user_progress')
            .upsert({
              user_id: user.id,
              current_stage: 'upload',
              completed_stages: ['shoot', 'payment'],
              last_active_at: new Date().toISOString(),
              stage_data: {
                payment: {
                  completedAt: new Date().toISOString(),
                  orderId: orderId,
                  sessionId: sessionId
                }
              }
            }, { onConflict: 'user_id' });

          return response;
        }
      }
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

    // Define stage order for validation
    const stageOrder = ['shoot', 'payment', 'upload', 'review', 'albums'];
    
    // Get the current path's stage (if it matches any)
    const pathStage = stageOrder.find(stage => currentPath.startsWith(`/app/${stage}`));
    
    // Special cases that are always allowed
    if (currentPath === '/app/settings/profile' || 
        currentPath.startsWith('/app/payment/success')) {
      return response;
    }

    // If we're on a stage path, validate access
    if (pathStage) {
      const currentStageIndex = stageOrder.indexOf(currentStage);
      const pathStageIndex = stageOrder.indexOf(pathStage);
      
      // After payment is completed:
      if (isPaymentCompleted) {
        // Check minimum image requirement for review page
        if (pathStage === 'review') {
          // Get the most recent paid order
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'paid')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (!orderError && orderData) {
            // Count images for this order
            const { count, error: imageError } = await supabase
              .from('images')
              .select('id', { count: 'exact' })
              .eq('order_id', orderData.id)

            if (!imageError && count !== null && count < UPLOAD_CONSTANTS.MIN_IMAGES) {
              // Redirect back to upload if not enough images
              return NextResponse.redirect(new URL('/app/upload', request.url))
            }
          }
        }

        // Allow movement between upload and review stages
        if ((pathStage === 'upload' && currentStage === 'review') || 
            (pathStage === 'review' && currentStage === 'upload')) {
          return response;
        }
        
        // For other stages, enforce staying on current stage
        if (pathStage !== currentStage) {
          return NextResponse.redirect(new URL(`/app/${currentStage}`, request.url));
        }
        return response;
      }
      
      // Before payment completion:
      // Block access to future stages
      if (pathStageIndex > currentStageIndex) {
        return NextResponse.redirect(new URL(`/app/${currentStage}`, request.url));
      }
      
      // Block access to upload/review/albums if payment not completed
      if (!isPaymentCompleted && pathStageIndex > stageOrder.indexOf('payment')) {
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