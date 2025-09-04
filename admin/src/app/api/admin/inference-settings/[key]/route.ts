import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const supabase = createServiceClient()
  const { key } = await params
  const { error } = await supabase.from('inference_settings').delete().eq('key', decodeURIComponent(key))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}


