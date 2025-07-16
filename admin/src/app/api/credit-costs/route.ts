import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('credit_costs')
      .select('*')
      .order('type')
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching credit costs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit costs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    
    const { error } = await supabase
      .from('credit_costs')
      .insert([body])
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating credit cost:', error)
    return NextResponse.json(
      { error: 'Failed to create credit cost' },
      { status: 500 }
    )
  }
} 