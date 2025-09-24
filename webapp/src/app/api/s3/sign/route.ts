import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPresignedGetUrl } from '@/lib/s3'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const rawUrl = url.searchParams.get('url') || ''
    const key = url.searchParams.get('key') || ''
    if (!rawUrl && !key) return NextResponse.json({ error: 'Missing url or key' }, { status: 400 })

    const toSign = key || rawUrl
    const signed = await createPresignedGetUrl(toSign)
    return NextResponse.json({ url: signed })
  } catch (e) {
    console.error('Sign URL error:', e)
    return NextResponse.json({ error: 'Failed to sign' }, { status: 500 })
  }
}

export function OPTIONS() { return NextResponse.json({}, { status: 200 }) }


