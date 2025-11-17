import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function getThumbUrl(keyOrUrl: string, width: number = 480): string {
  // Extract S3 key from URL if needed
  let key = keyOrUrl
  if (keyOrUrl.startsWith('http')) {
    try {
      const url = new URL(keyOrUrl)
      key = url.pathname.substring(1)
    } catch {
      key = keyOrUrl
    }
  }

  // Encode the entire key for the query parameter
  return `/api/media/thumbnail?key=${encodeURIComponent(key)}&w=${width}`
}

/**
 * Convert S3 keys/URLs to CloudFront CDN URLs
 */
function toCdnUrl(keyOrUrl: string): string {
  const cdn = process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || ''
  
  if (keyOrUrl.startsWith('http')) {
    try {
      const url = new URL(keyOrUrl)
      const path = url.pathname.substring(1)
      return `${cdn}/${path.split('/').map(encodeURIComponent).join('/')}`
    } catch {
      return keyOrUrl
    }
  }
  
  return `${cdn}/${keyOrUrl.split('/').map(encodeURIComponent).join('/')}`
}

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const { searchParams } = new URL(req.url)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('training_jobs')
      .select(`
        *,
        character:characters(
          id,
          name,
          thumbnail_url,
          lora_path,
          metadata,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit)

    if (error) {
      console.error('Error fetching training jobs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const hasMore = data.length > limit
    const jobs = hasMore ? data.slice(0, limit) : data

    // Convert S3 URLs to CDN URLs
    const jobsWithCdnUrls = jobs.map(job => ({
      ...job,
      character: job.character ? {
        ...job.character,
        thumbnail_url: job.character.thumbnail_url 
          ? getThumbUrl(job.character.thumbnail_url, 240)
          : null
      } : null
    }))

    return NextResponse.json({
      data: jobsWithCdnUrls,
      hasMore
    })
  } catch (err) {
    console.error('Error in training jobs API:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

