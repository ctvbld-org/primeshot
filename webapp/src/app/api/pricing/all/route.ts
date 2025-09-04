import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Fetch all pricing data in parallel
    const [subscriptionsResult, creditPacksResult, creditCostsResult] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('*')
        .order('monthly_price', { ascending: true }),
      
      supabase
        .from('credit_packs')
        .select('*')
        .order('credits', { ascending: true }),
      
      supabase
        .from('credit_costs')
        .select('*')
        .order('type', { ascending: true })
    ])

    // Check for errors
    if (subscriptionsResult.error) {
      console.error('Error fetching subscriptions:', subscriptionsResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions', details: subscriptionsResult.error.message },
        { status: 500 }
      )
    }

    if (creditPacksResult.error) {
      console.error('Error fetching credit packs:', creditPacksResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch credit packs', details: creditPacksResult.error.message },
        { status: 500 }
      )
    }

    if (creditCostsResult.error) {
      console.error('Error fetching credit costs:', creditCostsResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch credit costs', details: creditCostsResult.error.message },
        { status: 500 }
      )
    }

    // Transform credit costs to key-value format for easier consumption
    const costsMap = creditCostsResult.data.reduce((acc, cost) => {
      acc[cost.type] = cost.value
      return acc
    }, {} as Record<string, number>)

    // Return all pricing data in a single response
    const response = {
      subscriptions: subscriptionsResult.data,
      creditPacks: creditPacksResult.data,
      creditCosts: costsMap
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in pricing/all API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
