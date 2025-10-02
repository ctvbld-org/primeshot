import { NextRequest, NextResponse } from 'next/server'
import { createSecuredHandler, SECURITY_PRESETS } from '@/lib/security-middleware'

// This would typically be imported from the main webapp
// For now, we'll simulate the metrics data
interface UploadMetrics {
  operation: 'init' | 'sign-part' | 'complete' | 'abort'
  userId: string
  characterId?: string
  fileSize?: number
  totalChunks?: number
  partNumber?: number
  duration: number
  success: boolean
  error?: string
  timestamp: string
}

// Mock data for demonstration - in production this would come from the webapp's memory store
const mockUploadMetrics: UploadMetrics[] = [
  {
    operation: 'init',
    userId: 'user123',
    characterId: 'char456',
    fileSize: 5242880,
    totalChunks: 3,
    duration: 125,
    success: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    operation: 'sign-part',
    userId: 'user123',
    partNumber: 1,
    duration: 45,
    success: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString()
  },
  {
    operation: 'sign-part',
    userId: 'user123',
    partNumber: 2,
    duration: 52,
    success: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString()
  },
  {
    operation: 'complete',
    userId: 'user123',
    duration: 89,
    success: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString()
  },
  {
    operation: 'init',
    userId: 'user789',
    characterId: 'char101',
    fileSize: 10485760,
    totalChunks: 6,
    duration: 145,
    success: false,
    error: 'File too large',
    timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString()
  }
]

function calculateUploadStats(metrics: UploadMetrics[]) {
  const totalUploads = metrics.filter(m => m.operation === 'init').length
  const successfulUploads = metrics.filter(m => m.operation === 'complete' && m.success).length
  const failedUploads = metrics.filter(m => !m.success).length

  const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0)
  const averageDuration = metrics.length > 0 ? totalDuration / metrics.length : 0

  const operationCounts = metrics.reduce((acc, m) => {
    acc[m.operation] = (acc[m.operation] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const successRate = totalUploads > 0 ? (successfulUploads / totalUploads) * 100 : 0

  const recentUploads = metrics
    .filter(m => m.operation === 'complete')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  const errorBreakdown = metrics
    .filter(m => m.error)
    .reduce((acc, m) => {
      const error = m.error || 'Unknown'
      acc[error] = (acc[error] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const userActivity = metrics.reduce((acc, m) => {
    acc[m.userId] = (acc[m.userId] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalUploads,
    successfulUploads,
    failedUploads,
    successRate,
    averageDuration,
    operationCounts,
    recentUploads,
    errorBreakdown,
    userActivity,
    totalMetrics: metrics.length
  }
}

async function handleGetUploadMetrics(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const operation = url.searchParams.get('operation')

    // In production, this would fetch from the webapp's metrics store
    let filteredMetrics = [...mockUploadMetrics]

    if (operation) {
      filteredMetrics = filteredMetrics.filter(m => m.operation === operation)
    }

    // Sort by timestamp (most recent first)
    filteredMetrics.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply limit
    if (limit > 0) {
      filteredMetrics = filteredMetrics.slice(0, limit)
    }

    const stats = calculateUploadStats(mockUploadMetrics)

    return NextResponse.json({
      metrics: filteredMetrics,
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error fetching upload metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upload metrics', details: error.message },
      { status: 500 }
    )
  }
}

// Secured GET handler
const securedGET = createSecuredHandler(
  async (req: NextRequest) => {
    return await handleGetUploadMetrics(req)
  },
  SECURITY_PRESETS.ADMIN
)

export async function GET(req: NextRequest) {
  return await securedGET(req)
}
