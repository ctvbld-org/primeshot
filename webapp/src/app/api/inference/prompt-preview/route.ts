import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/inference-prompt-preview`

    // Try to get user session, but fallback to anon key if it fails (prevents 502 errors)
    let authToken = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    try {
      const sb = await createClient()
      const { data: { session } } = await sb.auth.getSession()
      if (session?.access_token) {
        authToken = session.access_token
      }
    } catch (sessionError) {
      // Continue with anon key if session lookup fails
      console.warn('Session lookup failed in prompt-preview, using anon key:', sessionError)
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      },
      body: JSON.stringify(body)
    })

    console.log('🔍 prompt-preview response status:', res.status)
    
    // Defensive parsing to handle non-JSON responses
    const responseText = await res.text()
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      // If upstream returns non-JSON (like HTML error page), wrap it
      data = { error: 'Invalid response from upstream', raw: responseText }
    }

    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    console.error('🔍 prompt-preview route error:', e)
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 })
  }
}


