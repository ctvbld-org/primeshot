import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // First, handle Supabase session
  const response = await updateSession(request)

  // Sync i18n cookie with explicit locale prefix when present (no redirects here)
  const { pathname } = request.nextUrl
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  const SUPPORTED = ['en','fr','es','it','pt','de','nl','cn','jp']

  if (first && SUPPORTED.includes(first)) {
    // Ensure language cookie reflects the URL locale for subsequent requests
    response.cookies.set('i18n_lang', first, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)'
  ]
}