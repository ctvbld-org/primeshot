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
    
    // Remove id field if present - let PostgreSQL auto-generate it
    const { id, ...dataWithoutId } = body
    
    const { data, error } = await supabase
      .from('credit_packs')
      .insert([dataWithoutId])
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error creating credit pack:', error)
    
    // Handle duplicate key constraint violations
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A credit pack with these values already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create credit pack' },
      { status: 500 }
    )
  }
} 