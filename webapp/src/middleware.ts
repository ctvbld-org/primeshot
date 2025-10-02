import { updateSession } from '@/lib/supabase/middleware'
import { logSecurityEvent } from '@/lib/security-monitoring'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Completely skip middleware for API routes to prevent any processing
  if (pathname.startsWith('/api/') || pathname.startsWith('/create/api/')) {
    return NextResponse.next()
  }

  const startTime = Date.now()
  
  // First, handle Supabase session
  const response = await updateSession(request)

  // Sync i18n cookie with explicit locale prefix when present (no redirects here)
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
    // Exclude API routes, webhooks, and static files from middleware processing
    '/((?!api/|_next/static|_next/image|favicon.ico|public).*)'
  ]
}