import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function DELETE(_req: Request, { params }: { params: { key: string } }) {
  const supabase = createClient()
  const { key } = params
  const { error } = await supabase.from('inference_settings').delete().eq('key', decodeURIComponent(key))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}


