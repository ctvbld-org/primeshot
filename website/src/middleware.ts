import { NextResponse, type NextRequest } from 'next/server'

const SUPPORTED = ['en','cn','es','fr','pt','de','jp','it','nl'] as const

function parseAcceptLanguage(header: string | null): string | null {
  if (!header) return null
  
  // Parse Accept-Language header (e.g., "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7")
  const parts = header.split(',').map(s => s.trim())
  
  // Build array of languages with their quality values
  const languages: Array<{ lang: string; quality: number }> = []
  
  for (const part of parts) {
    const [tag, qValue] = part.split(';')
    const quality = qValue ? parseFloat(qValue.replace('q=', '')) : 1.0
    
    if (tag && !isNaN(quality)) {
      languages.push({ lang: tag.trim(), quality })
    }
  }
  
  // Sort by quality (highest first)
  languages.sort((a, b) => b.quality - a.quality)
  
  // Try to find a supported language
  for (const { lang } of languages) {
    const normalized = mapToSupported(lang)
    if (normalized) {
      return normalized
    }
  }
  
  return null
}

function mapToSupported(tag: string | undefined | null): typeof SUPPORTED[number] | null {
  if (!tag) return null
  const lower = tag.toLowerCase().trim()
  
  // Exact match first (e.g., "fr" -> "fr")
  const exact = SUPPORTED.find(l => l.toLowerCase() === lower)
  if (exact) return exact
  
  // Map base language to a default region (e.g., "fr-FR" -> "fr")
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
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/.well-known') ||
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

  // Handle /create paths: detect language and set cookie before rewrite
  if (pathname.startsWith('/create')) {
    const cookieLocale = request.cookies.get('i18n_lang')?.value || null
    const validCookieLocale = cookieLocale && mapToSupported(cookieLocale)
    
    // If no valid cookie exists, detect from Accept-Language header
    if (!validCookieLocale) {
      const acceptLanguageHeader = request.headers.get('accept-language')
      const headerLocale = parseAcceptLanguage(acceptLanguageHeader)
      const detectedLocale = headerLocale || 'en'
      
      // Set the detected language cookie before the rewrite
      const res = NextResponse.next()
      res.cookies.set('i18n_lang', detectedLocale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
      
      console.log('[Website Language Detection for /create]', {
        pathname,
        acceptLanguageHeader,
        headerLocale,
        detectedLocale
      })
      
      return res
    }
    
    // Cookie already exists, let the rewrite happen
    return NextResponse.next()
  }

  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  const isLocalePrefixed = SUPPORTED.includes(first as typeof SUPPORTED[number])

  if (isLocalePrefixed) {
    // Ensure cookie is set for downstream usage
    const res = NextResponse.next()
    res.cookies.set('i18n_lang', first, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
    return res
  }

  // Determine locale from cookie or Accept-Language
  const cookieLocale = request.cookies.get('i18n_lang')?.value || null
  const acceptLanguageHeader = request.headers.get('accept-language')
  const headerLocale = parseAcceptLanguage(acceptLanguageHeader)
  
  // Priority: valid cookie > Accept-Language header > default 'en'
  // Only use cookie if it's a valid supported language
  let locale: string
  const validCookieLocale = cookieLocale && mapToSupported(cookieLocale)
  
  if (validCookieLocale) {
    locale = validCookieLocale
  } else if (headerLocale) {
    locale = headerLocale
  } else {
    locale = 'en'
  }

  // Debug logging - can be removed after testing
  console.log('[Language Detection]', {
    pathname,
    cookieLocale,
    validCookieLocale,
    acceptLanguageHeader,
    headerLocale,
    finalLocale: locale
  })

  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    // Match all paths except static assets and API routes
    '/((?!_next/static|_next/image|favicon.ico|public|api|images|og-image|.*\\..*|_next).*)',
    // Explicitly match root path
    '/'
  ]
}


