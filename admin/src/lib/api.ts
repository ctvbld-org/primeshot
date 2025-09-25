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

export function getApiUrl(path: string): string {
  const base = getBasePath()
  
  // Handle language prefixes: API routes should never have language prefixes
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname
    
    // Check if current path has a language prefix pattern (e.g., /en/, /fr/, /de/)
    const langPrefixMatch = currentPath.match(/^\/(\w{2})\//)
    
    if (langPrefixMatch) {
      // Language prefix detected - construct absolute URL to bypass language routing
      const origin = window.location.origin
      if (!path.startsWith('/')) path = '/' + path
      return `${origin}${base}${path}`
    }
  }
  
  // Ensure single slash between base and path
  if (!path.startsWith('/')) path = '/' + path
  return `${base}${path}`
}


