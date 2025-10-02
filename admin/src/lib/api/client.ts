/**
 * API URL helper that handles basePath configuration automatically
 * Mirrors webapp's implementation and handles language prefixes.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Get base path from environment
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH === '/' ? '' : (process.env.NEXT_PUBLIC_BASE_PATH || '')
  
  // Handle language prefixes: API routes should never have language prefixes
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname
    
    // Check if current path has a language prefix pattern (e.g., /en/, /fr/, /de/)
    const langPrefixMatch = currentPath.match(/^\/(\w{2})\//)
    
    if (langPrefixMatch) {
      // Language prefix detected - construct absolute URL to bypass language routing
      const origin = window.location.origin
      const targetPath = `${basePath || ''}/${cleanPath}`
      return `${origin}${targetPath}`
    }
  }
  
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

// AWS Cost monitoring types
export interface AWSCostData {
  startDate: string
  endDate: string
  granularity: 'DAILY' | 'MONTHLY'
  metrics: string[]
  groupBy?: string[]
}

export interface CostMetrics {
  totalCost: number
  previousPeriodCost: number
  costDifference: number
  costDifferencePercentage: number
  serviceBreakdown: Record<string, number>
  dailyCosts: Array<{ date: string; cost: number }>
  topCostDrivers: Array<{ service: string; cost: number; percentage: number }>
}

export interface S3Metrics {
  totalRequests: number
  totalBytesTransferred: number
  totalBytesStored: number
  averageRequestSize: number
  costPerGB: number
  costPerRequest: number
  uploadMetrics: {
    totalUploads: number
    totalUploadBytes: number
    averageUploadSize: number
    uploadSuccessRate: number
    uploadLatency: number
  }
  downloadMetrics: {
    totalDownloads: number
    totalDownloadBytes: number
    averageDownloadSize: number
    downloadSuccessRate: number
    downloadLatency: number
  }
}


