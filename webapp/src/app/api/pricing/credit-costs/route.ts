import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('Starting credit-costs API route')
    const supabase = await createClient()
    
    console.log('Created Supabase client, fetching credit costs')
    const { data: creditCosts, error } = await supabase
      .from('credit_costs')
      .select('*')
      .order('type', { ascending: true })

    if (error) {
      console.error('Error fetching credit costs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch credit costs', details: error.message },
        { status: 500 }
      )
    }

    console.log(`Successfully fetched ${creditCosts?.length || 0} credit costs`)
    // Transform to key-value format for easier consumption
    const costsMap = creditCosts.reduce((acc, cost) => {
      acc[cost.type] = cost.value
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json(costsMap)
  } catch (error) {
    console.error('Error in credit costs API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 