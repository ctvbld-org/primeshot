/**
 * API URL helper that handles basePath configuration automatically
 * In production, routes are prefixed with '/create' due to next.config.js basePath setting
 * Also handles language prefixes by ensuring API routes don't include them
 */
export function getApiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Get base path from environment
  let basePath = process.env.NEXT_PUBLIC_BASE_PATH === '/' ? '' : process.env.NEXT_PUBLIC_BASE_PATH
  
  // Handle language prefixes: API routes should never have language prefixes
  // If we're on a page with a language prefix (like /en/), we need to detect it
  // and ensure API calls don't include it
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname
    
    // Check if current path has a language prefix pattern (e.g., /en/, /fr/, /de/)
    const langPrefixMatch = currentPath.match(/^\/(\w{2})\//)
    
    if (langPrefixMatch) {
      // If we have a base path that already includes the language prefix, remove it
      const langPrefix = `/${langPrefixMatch[1]}`
      if (basePath && basePath.startsWith(langPrefix)) {
        basePath = basePath.slice(langPrefix.length) || ''
      }
    }
  }
  
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