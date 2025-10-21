/**
 * Admin API utilities
 * 
 * NOTE: This file re-exports from @primeshot/common for consistency.
 * The common package handles basePath and language prefixes automatically.
 */

// Re-export from common for all admin components
export { getApiUrl, apiRequest } from '@primeshot/common'

/**
 * @deprecated Use getApiUrl from @primeshot/common instead
 * 
 * Legacy getBasePath function - kept for backwards compatibility
 * but prefer using getApiUrl directly which handles basePath internally
 */
export function getBasePath(): string {
  // Prefer deriving from NEXT_PUBLIC_APP_URL if provided
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_APP_URL)
      const pathname = url.pathname || ''
      // Normalize: remove trailing slash except root
      const normalized = pathname.endsWith('/') && pathname !== '/' 
        ? pathname.slice(0, -1) 
        : pathname
      return normalized === '/' ? '' : normalized
    } catch {
      // fall through to other heuristics
    }
  }

  // Back-compat: explicit base path env if present
  if (typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_BASE_PATH) {
    return (process as any).env.NEXT_PUBLIC_BASE_PATH
  }

  if (typeof window !== 'undefined') {
    // If app is served under /admin, most asset URLs will start with /admin
    // Use a simple heuristic to detect it at runtime
    const pathname = window.location.pathname || ''
    if (pathname.startsWith('/admin')) return '/admin'
  }

  return ''
}

