import { updateSession } from '@/lib/supabase/middleware'
import { logSecurityEvent } from '@/lib/security-monitoring'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const SUPPORTED = ['en','fr','es','it','pt','de','nl','cn','jp'] as const

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

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname } = request.nextUrl

  // Ignore static assets (but not API routes - we want security monitoring on those)
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/public') ||
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
  
  // First, handle Supabase session
  const response = await updateSession(request)

  // Detect and set language cookie if not already set
  const cookieLocale = request.cookies.get('i18n_lang')?.value || null
  const validCookieLocale = cookieLocale && mapToSupported(cookieLocale)
  
  // Sync i18n cookie with explicit locale prefix when present (no redirects here)
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  const isLocalePrefixed = first && SUPPORTED.includes(first as typeof SUPPORTED[number])

  if (isLocalePrefixed) {
    // Ensure language cookie reflects the URL locale for subsequent requests
    response.cookies.set('i18n_lang', first, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  } else if (!validCookieLocale) {
    // No valid cookie exists - detect from Accept-Language header
    const acceptLanguageHeader = request.headers.get('accept-language')
    const headerLocale = parseAcceptLanguage(acceptLanguageHeader)
    const detectedLocale = headerLocale || 'en'
    
    // Set the detected language cookie
    response.cookies.set('i18n_lang', detectedLocale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
    
    // Debug logging - can be removed after testing
    console.log('[Webapp Language Detection]', {
      pathname,
      cookieLocale,
      acceptLanguageHeader,
      headerLocale,
      detectedLocale
    })
  }

  // Add security monitoring for API routes
  if (pathname.startsWith('/api/')) {
    const duration = Date.now() - startTime
    
    // Log slow requests as potential attacks
    if (duration > 5000) { // 5 seconds
      logSecurityEvent(
        'suspicious_request',
        'medium',
        `Unusually slow request detected (${duration}ms)`,
        {
          request,
          metadata: { duration, statusCode: response.status }
        }
      )
    }

    // Log 4xx/5xx responses for security monitoring
    if (response.status >= 400) {
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
      let type: 'rate_limit_exceeded' | 'bot_detected' | 'suspicious_request' | 'auth_failure' | 'unauthorized_access' | 'malicious_payload' | 'unusual_traffic' = 'suspicious_request'

      if (response.status === 401 || response.status === 403) {
        type = 'auth_failure'
        severity = 'medium'
      } else if (response.status === 429) {
        type = 'rate_limit_exceeded'
        severity = 'medium'
      } else if (response.status >= 500) {
        type = 'suspicious_request'
        severity = 'high'
      }

      logSecurityEvent(
        type,
        severity,
        `HTTP ${response.status} response on ${pathname}`,
        {
          request,
          statusCode: response.status,
          metadata: { duration, endpoint: pathname }
        }
      )
    }

    // Add security monitoring headers
    response.headers.set('X-Security-Monitor', 'enabled')
    response.headers.set('X-Request-ID', crypto.randomUUID())
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)'
  ]
}