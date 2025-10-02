import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSecuredHandler, SECURITY_PRESETS } from '@/lib/security-middleware'

async function handlePOST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const firstName: string = (body.firstName || '').trim()
    const lastName: string = (body.lastName || '').trim()
    const avatarUrl: string | undefined = body.avatarUrl || undefined

    const full_name = [firstName, lastName].filter(Boolean).join(' ').trim() || null

    const { data, error } = await supabase
      .from('users')
      .update({ full_name, avatar_url: avatarUrl })
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

// Secured handler with authentication and rate limiting
const securedPOST = createSecuredHandler(
  handlePOST,
  SECURITY_PRESETS.IMAGE_UPLOAD
);

export async function POST(request: NextRequest) {
  return await securedPOST(request);
}

export function OPTIONS() { return NextResponse.json({}, { status: 200 }) }


