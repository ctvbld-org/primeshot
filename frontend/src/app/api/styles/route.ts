import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  
  try {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          }
        }
      }
    )
    
    // Check if user is authenticated - use getUser() instead of getSession()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    let query = supabase
      .from('styles')
      .select('*')
      .eq('user_id', user.id)
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }
    
    // Order by created_at
    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching styles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch styles' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ styles: data })
  } catch (error) {
    console.error('Error in styles API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 