import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('inference_settings')
      .select('key, value')
    if (error) throw error

    const map: Record<string, any> = {}
    for (const row of data || []) map[row.key] = row.value
    return NextResponse.json(map)
  } catch (e) {
    console.error('Admin inference settings GET failed:', e)
    return NextResponse.json({ error: 'Failed to fetch inference settings' }, { status: 500 })
  }
}


