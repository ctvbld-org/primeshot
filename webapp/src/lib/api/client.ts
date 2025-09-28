/**
 * API URL helper that handles basePath configuration automatically
 * In production, routes are prefixed with '/create' due to next.config.js basePath setting
 * With Next.js i18n, API routes are automatically excluded from locale routing
 */
export function getApiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Get base path from environment
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH === '/' ? '' : process.env.NEXT_PUBLIC_BASE_PATH
  
  // Return the API URL with base path
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