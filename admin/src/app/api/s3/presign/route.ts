import { NextRequest, NextResponse } from 'next/server'
import { createPresignedGetUrl } from '@/lib/s3'

/**
 * API Route: POST /api/s3/presign
 * 
 * Generates S3 presigned URLs for the provided image URLs/paths
 * Accepts an array of URLs and returns an array of signed URLs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { urls } = body

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      )
    }

    // Generate presigned URLs for all provided URLs
    const signedUrls = await Promise.all(
      urls.map(async (url: string) => {
        if (!url) return null
        
        try {
          return await createPresignedGetUrl(url)
        } catch (error) {
          console.error('Error signing URL:', url, error)
          return null
        }
      })
    )

    return NextResponse.json({ signedUrls })
  } catch (error) {
    console.error('Error in presign endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to generate presigned URLs' },
      { status: 500 }
    )
  }
}

