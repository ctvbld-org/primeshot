import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

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

        // Check for user progress - select all needed fields
        const { data: progress, error: progressError } = await supabase
          .from('user_progress')
          .select('*') // Select all fields needed for logic below
          .eq('user_id', user.id)
          .maybeSingle()

        if (progressError) {
             console.error('Error checking user progress on login:', progressError)
             // Handle potential DB errors here
        }

        // Create initial progress using UPSERT if no progress exists
        if (!progress) {
          console.log(`No progress found for user ${user.id}, creating initial record...`)
          const { error: createError } = await supabase
            .from('user_progress')
            .upsert({
              user_id: user.id,
              current_stage: 'shoot', // Start at shoot
              completed_stages: [], // No stages completed yet
              stage_data: {},
              last_active_at: new Date().toISOString()
            }, { onConflict: 'user_id' }) // IMPORTANT: Use onConflict
            
          if (createError) {
            console.error('Error creating initial user progress:', createError)
            // Handle this failure - maybe user can't proceed?
          } else {
             console.log(`Initial progress created for user ${user.id}.`)
          }
        } else {
           console.log(`Existing progress found for user ${user.id}.`)
        }

        // Create a new response with the redirect
        const targetPath = progress && !progress.completed_stages.includes('payment')
          ? `/${progress.current_stage}`
          : (process.env.NEXT_PUBLIC_POST_LOGIN_PATH || '/')

        const response = NextResponse.redirect(new URL(targetPath, requestUrl.origin))
        
        // Copy over the cookies from the cookie store
        const allCookies = cookieStore.getAll()
        allCookies.forEach(cookie => {
          response.cookies.set(cookie.name, cookie.value)
        })

        return response
      }
      
      // If no user, redirect to home
      return NextResponse.redirect(new URL('/', requestUrl.origin))
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }
  }

  return NextResponse.redirect(`${origin}/app`)
} 