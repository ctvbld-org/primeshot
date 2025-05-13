import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPresignedGetUrl } from '@/lib/s3'
import { Image as ImageType } from '@/lib/types'

type ImageRecord = ImageType

/**
 * API Route: /api/user-images
 * 
 * Retrieves user-uploaded images from the database with presigned S3 URLs.
 * Requires authentication and returns images filtered by user ID and optional
 * image ID or order ID parameters.
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(request.url)
    const imageId = url.searchParams.get('imageId')
    const orderId = url.searchParams.get('orderId')

    if (!imageId && !orderId) {
      return NextResponse.json({ error: 'Missing imageId or orderId parameter' }, { status: 400 })
    }

    // Create Supabase client
    const supabase = await createClient()

    // Get current user for authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If imageId is provided, fetch single image
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

      // Generate signed URL
      const signedUrl = await createPresignedGetUrl(image.url)
      return NextResponse.json({ url: signedUrl })
    }

    // If orderId is provided, fetch all images for that order
    if (orderId) {
      const { data: images, error: imagesError } = await supabase
        .from('images')
        .select('id, url')
        .eq('order_id', orderId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (imagesError) {
        return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
      }

      // Generate signed URLs for all images
      const imagesWithSignedUrls = await Promise.all(
        (images || []).map(async (image) => ({
          ...image,
          url: await createPresignedGetUrl(image.url)
        }))
      )

      return NextResponse.json(imagesWithSignedUrls)
    }
  } catch (error) {
    console.error('Error in user-images API route:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
} 