import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { key, value } = body || {}
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  const { error } = await supabase.from('inference_settings').upsert({ key, value })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}


