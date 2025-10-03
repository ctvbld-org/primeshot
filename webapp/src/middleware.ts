import { updateSession } from '@/lib/supabase/middleware'
import { logSecurityEvent } from '@/lib/security-monitoring'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  
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