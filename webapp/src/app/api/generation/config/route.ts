import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Fetch inference settings and credit costs in parallel (most relevant for generation)
    const [inferenceResult, creditCostsResult] = await Promise.all([
      supabase
        .from('inference_settings')
        .select('key, value'),
      
      supabase
        .from('credit_costs')
        .select('*')
        .order('type', { ascending: true })
    ])

    // Check for errors
    if (inferenceResult.error) {
      console.error('Error fetching inference settings:', inferenceResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch inference settings', details: inferenceResult.error.message },
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

    // Transform inference settings to key-value map
    const inferenceSettings: Record<string, any> = {}
    for (const row of inferenceResult.data || []) {
      inferenceSettings[row.key] = row.value
    }

    // Transform credit costs to key-value format
    const creditCosts = creditCostsResult.data.reduce((acc, cost) => {
      acc[cost.type] = cost.value
      return acc
    }, {} as Record<string, number>)

    // Return combined generation configuration
    const response = {
      inferenceSettings,
      creditCosts
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in generation/config API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
