import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: creditCosts, error } = await supabase
      .from('credit_costs')
      .select('value')
      .eq('type', 'FACE_MODEL_TRAINING')
      .single()

    if (error) {
      console.error('Error fetching face model training cost:', error)
      return NextResponse.json(
        { error: 'Failed to fetch face model training cost' },
        { status: 500 }
      )
    }

    return NextResponse.json({ cost: creditCosts.value })
  } catch (error) {
    console.error('Error in face model training cost API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 