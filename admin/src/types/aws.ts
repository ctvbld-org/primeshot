/**
 * AWS Cost monitoring types for admin dashboard
 */

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

