import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSecuredHandler, SECURITY_PRESETS } from '@/lib/security-middleware'

interface JobFailureStats {
  training: {
    total: number
    failed: number
    failureRate: number
    recentFailures: Array<{
      id: string
      user_id: string
      character_id: string
      error_message: string
      retry_count: number
      created_at: string
      updated_at: string
    }>
  }
  inference: {
    total: number
    failed: number
    failureRate: number
    recentFailures: Array<{
      id: string
      user_id: string
      character_id: string
      error_message: string
      created_at: string
      updated_at: string
    }>
  }
  summary: {
    totalJobs: number
    totalFailures: number
    overallFailureRate: number
    timeWindow: string
  }
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const hours = Math.min(Math.max(1, parseInt(url.searchParams.get('hours') || '24')), 168) // Max 1 week
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '10')), 50) // Max 50 failures

    const windowStart = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    // Get training job statistics
    const [trainingTotal, trainingFailed] = await Promise.all([
      supabase
        .from('training_jobs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', windowStart),
      supabase
        .from('training_jobs')
        .select('*')
        .eq('status', 'failed')
        .gte('created_at', windowStart)
        .order('updated_at', { ascending: false })
        .limit(limit)
    ])

    // Get inference job statistics
    const [inferenceTotal, inferenceFailed] = await Promise.all([
      supabase
        .from('inference_jobs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', windowStart),
      supabase
        .from('inference_jobs')
        .select('*')
        .eq('status', 'failed')
        .gte('created_at', windowStart)
        .order('updated_at', { ascending: false })
        .limit(limit)
    ])

    if (trainingTotal.error || trainingFailed.error || inferenceTotal.error || inferenceFailed.error) {
      console.error('Error fetching job statistics:', {
        trainingTotal: trainingTotal.error,
        trainingFailed: trainingFailed.error,
        inferenceTotal: inferenceTotal.error,
        inferenceFailed: inferenceFailed.error
      })
      return NextResponse.json({ error: 'Failed to fetch job statistics' }, { status: 500 })
    }

    const trainingTotalCount = trainingTotal.count || 0
    const trainingFailedCount = trainingFailed.data?.length || 0
    const inferenceTotalCount = inferenceTotal.count || 0
    const inferenceFailedCount = inferenceFailed.data?.length || 0

    const totalJobs = trainingTotalCount + inferenceTotalCount
    const totalFailures = trainingFailedCount + inferenceFailedCount

    const stats: JobFailureStats = {
      training: {
        total: trainingTotalCount,
        failed: trainingFailedCount,
        failureRate: trainingTotalCount > 0 ? (trainingFailedCount / trainingTotalCount) * 100 : 0,
        recentFailures: (trainingFailed.data || []).map(job => ({
          id: job.id,
          user_id: job.user_id,
          character_id: job.character_id,
          error_message: job.error_message || 'Unknown error',
          retry_count: job.retry_count || 0,
          created_at: job.created_at,
          updated_at: job.updated_at
        }))
      },
      inference: {
        total: inferenceTotalCount,
        failed: inferenceFailedCount,
        failureRate: inferenceTotalCount > 0 ? (inferenceFailedCount / inferenceTotalCount) * 100 : 0,
        recentFailures: (inferenceFailed.data || []).map(job => ({
          id: job.id,
          user_id: job.user_id,
          character_id: job.character_id,
          error_message: job.error_message || 'Unknown error',
          created_at: job.created_at,
          updated_at: job.updated_at
        }))
      },
      summary: {
        totalJobs,
        totalFailures,
        overallFailureRate: totalJobs > 0 ? (totalFailures / totalJobs) * 100 : 0,
        timeWindow: `${hours} hours`
      }
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error in AI job monitoring API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Secured handler with authentication
const securedGET = createSecuredHandler(
  handleGET,
  {
    ...SECURITY_PRESETS.USER_DATA,
    requireAuth: true
  }
);

export async function GET(request: NextRequest) {
  return await securedGET(request);
}
