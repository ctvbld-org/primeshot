/**
 * API URL helper that handles basePath configuration automatically
 * In production, routes are prefixed with '/create' due to next.config.js basePath setting
 */
export function getApiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Detect if we need the basePath prefix
  // Method 1: Check if we're in browser and current path includes /create
  // Method 2: Use environment variable detection
  let needsBasePath = false
  
  if (typeof window !== 'undefined') {
    // We're in the browser - check current URL
    needsBasePath = window.location.pathname.startsWith('/create')
  } else {
    // We're on server side - use same logic as next.config.js
    // VERCEL_TARGET_ENV !== 'local' OR NODE_ENV === 'production'
    needsBasePath = process.env.VERCEL_TARGET_ENV !== 'local' 
  }
  
  // In production, we need to manually add the basePath prefix for client-side requests
  if (needsBasePath) {
    return `/create/${cleanPath}`
  }
  
  return `/${cleanPath}`
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