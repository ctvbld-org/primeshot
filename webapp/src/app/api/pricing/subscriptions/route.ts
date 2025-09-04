import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('Starting subscriptions API route')
    const supabase = await createClient()
    
    console.log('Created Supabase client, fetching subscriptions')
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('monthly_price', { ascending: true })

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions', details: error.message },
        { status: 500 }
      )
    }

    console.log(`Successfully fetched ${subscriptions?.length || 0} subscriptions`)
    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error('Error in subscriptions API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 