import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inference_settings')
      .select('key, value')

    if (error) {
      console.error('Failed to fetch inference settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Return raw map without hardcoded fallbacks
    const map: Record<string, any> = {}
    for (const row of data || []) map[row.key] = row.value
    return NextResponse.json(map)
  } catch (e) {
    console.error('inference/settings GET failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


