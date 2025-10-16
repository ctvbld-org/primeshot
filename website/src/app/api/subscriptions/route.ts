import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client for server-side use
// Using service role for public data access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('disabled', false)
      .order('monthly_price', { ascending: true })

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error('Error in subscriptions API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

