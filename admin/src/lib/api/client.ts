/**
 * API URL helper that handles basePath configuration automatically
 * Mirrors webapp's implementation.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH === '/' ? '' : (process.env.NEXT_PUBLIC_BASE_PATH || '')
  return `${basePath}/${cleanPath}`
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = getApiUrl(path)
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`API request failed: ${res.status}`)
  return res.json()
}


