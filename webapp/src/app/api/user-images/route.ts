import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPresignedGetUrl, deleteFromS3 } from '@/lib/s3'
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
 * - imageId: ID of the image to look up
 * - orderId: ID of the order to get images for
 * - url: Direct S3 URL to generate presigned URL for (for thumbnails)
 * 
 * Requires authentication and validates user access.
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(request.url)
    const imageId = url.searchParams.get('imageId')
    const orderId = url.searchParams.get('orderId')
    const directUrl = url.searchParams.get('url')

    // Create Supabase client for auth check
    const supabase = await createClient()

    // Get current user for authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If imageId is provided, look up the image
    if (imageId) {
      const { data: image, error: imageError } = await supabase
        .from('uploaded_images')
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
        .from('uploaded_images')
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

    // If direct URL is provided, generate presigned URL for it
    if (directUrl) {
      try {
        const signedUrl = await createPresignedGetUrl(directUrl)
        return NextResponse.json({ url: signedUrl })
      } catch (error) {
        console.error('Error creating presigned URL for direct URL:', error)
        return NextResponse.json({ error: 'Failed to create presigned URL' }, { status: 500 })
      }
    }

    return NextResponse.json(
      { error: 'Missing required parameter: imageId, orderId, or url' }, 
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in user-images API route:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/user-images
 * 
 * Deletes an image from both S3 and the Supabase database.
 * Requires imageId parameter and validates user ownership.
 */
export async function DELETE(request: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(request.url)
    const imageId = url.searchParams.get('imageId')

    if (!imageId) {
      return NextResponse.json({ error: 'Missing required parameter: imageId' }, { status: 400 })
    }

    // Create Supabase client for auth check
    const supabase = await createClient()

    // Get current user for authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the image record to verify ownership and then delete it while returning its URL
    const { data: deleted, error: deleteError } = await supabase
      .from('uploaded_images')
      .delete()
      .eq('id', imageId)
      .eq('user_id', user.id)
      .select('url')
      .single()

    if (deleteError || !deleted) {
      // If nothing was deleted, treat as not found; otherwise log the DB error
      if (!deleted) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 })
      }
      console.error('Error deleting image record:', deleteError)
      return NextResponse.json({ error: 'Failed to delete image record' }, { status: 500 })
    }

    // Now delete from S3
    try {
      const urlObj = new URL(decodeURIComponent(deleted.url))
      // Remove leading slash and bucket name if present
      let key = decodeURIComponent(urlObj.pathname.substring(1))
      const bucketName = process.env.AWS_S3_BUCKET
      if (bucketName && key.startsWith(`${bucketName}/`)) {
        key = key.substring(bucketName.length + 1)
      }
      await deleteFromS3(key)
    } catch (error) {
      console.error('Error deleting from S3:', error)
      // At this point the DB record is already removed
      return NextResponse.json(
        { error: 'Failed to delete image from storage but record removed' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in user-images DELETE route:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
} 