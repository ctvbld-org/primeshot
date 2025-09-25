import { NextResponse, type NextRequest } from 'next/server'

const SUPPORTED = ['en','cn','es','fr','pt','de','jp','it','nl'] as const

function parseAcceptLanguage(header: string | null): string | null {
  if (!header) return null
  const parts = header.split(',').map(s => s.trim())
  for (const part of parts) {
    const [tag] = part.split(';')
    // Map base to region if needed
    const normalized = mapToSupported(tag)
    if (normalized) return normalized
  }
  return null
}

function mapToSupported(tag: string | undefined | null): typeof SUPPORTED[number] | null {
  if (!tag) return null
  const lower = tag.toLowerCase()
  // Exact match first
  const exact = SUPPORTED.find(l => l.toLowerCase() === lower)
  if (exact) return exact
  // Map base language to a default region
  const base = lower.split('-')[0]
  switch (base) {
    case 'en': return 'en'
    case 'zh': return 'cn'
    case 'es': return 'es'
    case 'fr': return 'fr'
    case 'pt': return 'pt'
    case 'de': return 'de'
    case 'ja': return 'jp'
    case 'it': return 'it'
    case 'nl': return 'nl'
    default: return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore static and API assets
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/public') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.webmanifest')
  ) {
    return NextResponse.next()
  }

  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  const isLocalePrefixed = SUPPORTED.includes(first as any)

  if (isLocalePrefixed) {
    // Ensure cookie is set for downstream usage
    const res = NextResponse.next()
    res.cookies.set('i18n_lang', first, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
    return res
  }

  // Determine locale from cookie or Accept-Language
  const cookieLocale = request.cookies.get('i18n_lang')?.value || null
  const headerLocale = parseAcceptLanguage(request.headers.get('accept-language'))
  const locale = (mapToSupported(cookieLocale) || headerLocale || 'en-GB') as string

  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api|images|og-image).*)'
  ]
}


