import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/inference-prompt-preview`

    // Attach Authorization header (prefer user session; fallback to anon key) so EF doesn't 401
    const sb = await createClient()
    const { data: { session } } = await sb.auth.getSession()
    const authToken = session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 })
  }
}


