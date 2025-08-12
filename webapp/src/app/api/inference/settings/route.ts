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

    const map: Record<string, any> = {}
    for (const row of data || []) map[row.key] = row.value

    const settings = {
      qualities: map['qualities'] || ['1K', '2K', '4K'],
      quality_labels: map['quality_labels'] || { '1K': 'Basic', '2K': 'Standard', '4K': 'High' },
      nb_takes_options: map['nb_takes_options'] || [5, 15, 20],
      aspect_ratios: map['aspect_ratios'] || ['4:5', '16:9', '1:1', '3:4'],
      defaults: map['defaults'] || { quality: '1K', nb_takes: 5, aspect_ratio: '4:5' },
    }

    return NextResponse.json(settings)
  } catch (e) {
    console.error('inference/settings GET failed:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


