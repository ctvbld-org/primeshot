import { NextResponse, type NextRequest } from 'next/server'

const SUPPORTED = ['us','gb','cn','es','fr','pt','de','jp','it','nl'] as const

// Backward compatibility: normalize legacy formats to country codes
function normalizeLegacyLanguage(lang: string): string {
  const lower = lang.toLowerCase().trim()
  
  // Handle ISO format (en-GB, en-US, fr-FR, etc.)
  if (lower.includes('-')) {
    const [base, region] = lower.split('-')
    if (base === 'en') {
      return (region === 'us' || region === 'usa') ? 'us' : 'gb'
    }
    // For other languages, return the base language as country code
    return base
  }
  
  // Handle legacy 'en' -> 'gb'
  if (lower === 'en') return 'gb'
  
  return lang
}

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
  
  // Map base language to a default region
  const base = lower.split('-')[0]
  switch (base) {
    case 'en':
      // Map English to US by default, unless explicitly GB
      if (lower.includes('gb') || lower.includes('uk')) return 'gb'
      return 'us'
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

  // Handle OPTIONS requests (CORS preflight) for all routes
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Configure CSP to allow third-party analytics and tracking scripts
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' 
      https://www.googletagmanager.com 
      https://www.google-analytics.com 
      https://ssl.google-analytics.com
      https://va.vercel-scripts.com
      https://r.wdfl.co;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https: blob:;
    font-src 'self' data:;
    connect-src 'self' 
      https://www.google-analytics.com
      https://analytics.google.com
      https://vitals.vercel-insights.com
      https://*.supabase.co
      https://*.amazonaws.com;
    frame-src 'self' https://www.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

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
    // Normalize legacy 'en' to 'gb' for backward compatibility
    const normalizedCookie = cookieLocale ? normalizeLegacyLanguage(cookieLocale) : null
    const validCookieLocale = normalizedCookie && mapToSupported(normalizedCookie)
    
    // If no valid cookie exists, detect from Accept-Language header
    if (!validCookieLocale) {
      const acceptLanguageHeader = request.headers.get('accept-language')
      const headerLocale = parseAcceptLanguage(acceptLanguageHeader)
      const detectedLocale = headerLocale || 'en'
      
      // Set the detected language cookie before the rewrite
      const res = NextResponse.next()
      res.cookies.set('i18n_lang', detectedLocale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
      res.headers.set('Content-Security-Policy', cspHeader)
      
      console.log('[Website Language Detection for /create]', {
        pathname,
        acceptLanguageHeader,
        headerLocale,
        detectedLocale
      })
      
      return res
    }
    
    // Cookie already exists, let the rewrite happen
    const res = NextResponse.next()
    res.headers.set('Content-Security-Policy', cspHeader)
    return res
  }

  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  const isLocalePrefixed = SUPPORTED.includes(first as typeof SUPPORTED[number])

  if (isLocalePrefixed) {
    // Ensure cookie is set for downstream usage
    const res = NextResponse.next()
    res.cookies.set('i18n_lang', first, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
    res.headers.set('Content-Security-Policy', cspHeader)
    return res
  }

  // Determine locale from cookie or Accept-Language
  const cookieLocale = request.cookies.get('i18n_lang')?.value || null
  // Normalize legacy 'en' to 'gb' for backward compatibility
  const normalizedCookie = cookieLocale ? normalizeLegacyLanguage(cookieLocale) : null
  const acceptLanguageHeader = request.headers.get('accept-language')
  const headerLocale = parseAcceptLanguage(acceptLanguageHeader)
  
  // Priority: valid cookie > Accept-Language header > default 'us'
  // Only use cookie if it's a valid supported language
  let locale: string
  const validCookieLocale = normalizedCookie && mapToSupported(normalizedCookie)
  
  if (validCookieLocale) {
    locale = validCookieLocale
  } else if (headerLocale) {
    locale = headerLocale
  } else {
    locale = 'us'
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
  const response = NextResponse.redirect(url)
  response.headers.set('Content-Security-Policy', cspHeader)
  return response
}

export const config = {
  matcher: [
    // Match all paths except static assets and API routes
    '/((?!_next/static|_next/image|favicon.ico|public|api|images|og-image|.*\\..*|_next).*)',
    // Explicitly match root path
    '/'
  ]
}


