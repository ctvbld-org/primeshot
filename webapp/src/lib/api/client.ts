/**
 * API URL helper that handles basePath configuration automatically
 * In production, routes are prefixed with '/create' due to next.config.js basePath setting
 * Also handles language prefixes by ensuring API routes don't include them
 */
export function getApiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Handle language prefixes: API routes should never have language prefixes
  // For staging/production with language routing, construct absolute URLs to bypass routing issues
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname
    
    // Check for language prefixes (2-3 letter codes: en, fr, de, zh-CN, etc.)
    const langPrefixMatch = currentPath.match(/^\/(\w{2}(-\w{2})?)\//)
    
    if (langPrefixMatch) {
      // Language prefix detected - construct absolute URL to bypass language routing
      const origin = window.location.origin
      
      // Get base path from environment or infer from current path
      let basePath = process.env.NEXT_PUBLIC_BASE_PATH === '/' ? '' : process.env.NEXT_PUBLIC_BASE_PATH
      
      // Fallback: infer base path if environment variable is not available
      if (!basePath) {
        const pathWithoutLang = currentPath.replace(/^\/\w{2}(-\w{2})?\//, '/')
        if (pathWithoutLang.startsWith('/create')) {
          basePath = '/create'
        } else if (pathWithoutLang.startsWith('/admin')) {
          basePath = '/admin'
        }
      }
      
      const targetPath = `${basePath || ''}/${cleanPath}`
      return `${origin}${targetPath}`
    }
  }
  
  // No language prefix detected, use relative URL with environment base path
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH === '/' ? '' : process.env.NEXT_PUBLIC_BASE_PATH
  
  // No language prefix detected, use relative URL
  return `${basePath || ''}/${cleanPath}`
}

/**
 * Makes an authenticated API request with proper error handling
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getApiUrl(path)
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API request failed: ${response.status} ${error}`)
  }
  
  return response.json()
} 