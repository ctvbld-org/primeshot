import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('credit_packs')
      .select('*')
      .order('price')
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching credit packs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit packs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    
    const { error } = await supabase
      .from('credit_packs')
      .insert([body])
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating credit pack:', error)
    return NextResponse.json(
      { error: 'Failed to create credit pack' },
      { status: 500 }
    )
  }
} 