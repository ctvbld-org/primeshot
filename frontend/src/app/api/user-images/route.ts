import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPresignedGetUrl } from '@/lib/s3'
import { Image as ImageType } from '@/lib/types'

type ImageRecord = ImageType

// Helper to convert mime types
const getMimeType = (path: string): string => {
  const extension = path.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
};

/**
 * API Route: /api/user-images
 * 
 * Returns signed URLs for user-uploaded images from S3.
 * Accepts either:
 * - s3_url: Direct S3 URL to generate signed URL for
 * - imageId: ID of the image to look up
 * - orderId: ID of the order to get images for
 * 
 * Requires authentication and validates user access.
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(request.url)
    const s3Url = url.searchParams.get('s3_url')
    const imageId = url.searchParams.get('imageId')
    const orderId = url.searchParams.get('orderId')

    // Create Supabase client for auth check
    const supabase = await createClient()

    // Get current user for authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // If direct S3 URL is provided, generate signed URL
    if (s3Url) {
      // No need to decode as URLSearchParams handles it automatically
      const signedUrl = await createPresignedGetUrl(s3Url)
      return NextResponse.json({ url: signedUrl })
    }

    // If imageId is provided, look up the image
    if (imageId) {
      const { data: image, error: imageError } = await supabase
        .from('images')
        .select('url')
        .eq('id', imageId)
        .eq('user_id', user.id)
        .single()

      if (imageError || !image) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 })
      }

      const signedUrl = await createPresignedGetUrl(image.url)
      return NextResponse.json({ url: signedUrl })
    }

    // If orderId is provided, look up all images for the order
    if (orderId) {
      const { data: images, error: imagesError } = await supabase
        .from('images')
        .select('url')
        .eq('order_id', orderId)
        .eq('user_id', user.id)

      if (imagesError) {
        return NextResponse.json({ error: 'Failed to fetch order images' }, { status: 500 })
      }

      const signedUrls = await Promise.all(
        images.map(image => createPresignedGetUrl(image.url))
      )

      return NextResponse.json(signedUrls)
    }

    return NextResponse.json(
      { error: 'Missing required parameter: s3_url, imageId, or orderId' }, 
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in user-images API route:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
} 