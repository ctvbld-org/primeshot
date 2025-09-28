import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SUPPORTED = ['en','fr','es','it','pt','de','nl','cn','jp'] as const

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore static and API assets
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/create/api') ||
    pathname.startsWith('/admin/api')
  ) {
    return updateSession(request)
  }

  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  const isLocalePrefixed = SUPPORTED.includes(first as typeof SUPPORTED[number])

  if (!isLocalePrefixed) {
    const url = request.nextUrl.clone()
    url.pathname = `/en${pathname}`
    return NextResponse.redirect(url)
  }

  // Set cookie for downstream usage
  const res = await updateSession(request)
  res.cookies.set('i18n_lang', first!, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)'
  ]
}