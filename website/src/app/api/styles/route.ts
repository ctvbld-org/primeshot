import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    
    const { data: styles, error } = await supabase
      .from('styles')
      .select('id, name, preview_images')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching styles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch styles', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(styles)
  } catch (error) {
    console.error('Error in styles API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

