import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: creditPacks, error } = await supabase
      .from('credit_packs')
      .select('*')
      .order('credits', { ascending: true })

    if (error) {
      console.error('Error fetching credit packs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch credit packs' },
        { status: 500 }
      )
    }

    return NextResponse.json(creditPacks)
  } catch (error) {
    console.error('Error in credit packs API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 