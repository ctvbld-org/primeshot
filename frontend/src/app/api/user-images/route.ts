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
    const orderId = url.searchParams.get('orderId') // Get potential orderId param
    // const userId = url.searchParams.get('userId') // userId param likely not needed as we use authenticated user

    // Create Supabase client
    const supabase = await createClient()

    // Get current user for authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Set up query based on parameters
    let query = supabase.from('images').select('*');
    
    // Always filter by the authenticated user
    query = query.eq('user_id', user.id);

    if (imageId) {
      // If imageId is provided, filter by that specific image
      query = query.eq('id', imageId);
    } else if (orderId) {
      // If orderId is provided, filter by that order
      query = query.eq('order_id', orderId);
    } 
    // If neither imageId nor orderId is provided, it implicitly fetches all images for the user (due to the user_id filter)
    // Consider if this fallback (fetching *all* user images) is desired or if an orderId should be required for listing.
    // For now, keeping the fallback.

    // Add sorting
    query = query.order('created_at', { ascending: false });

    // Execute query
    const { data: images, error } = await query

    if (error) {
      console.error('Database error fetching images:', error)
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
    }

    if (!images || images.length === 0) {
      // If no images found, return empty array but not an error
      return NextResponse.json([])
    }

    // Generate presigned URLs for each image
    const imagesWithPresignedUrls = await Promise.all(
      (images || []).map(async (image: ImageRecord) => {
        try {
          // Extract the key from the URL - handle different possible formats
          let key = image.url; // Use the stored URL which should be the S3 path/key
          try {
            // Attempt to parse in case it's a full URL, extract path
            const parsedUrl = new URL(image.url);
            key = parsedUrl.pathname.substring(1); // Remove leading slash
            const bucketName = process.env.AWS_S3_BUCKET_NAME; // Use correct env var if different
            if (bucketName && key.startsWith(bucketName + '/')) {
              key = key.substring(bucketName.length + 1);
            }
          } catch (urlError) {
            // If parsing fails, assume it's already just the key
             console.warn(`Image URL ${image.url} might not be a full URL, using as key.`);
          }
          
          const presignedUrl = await createPresignedGetUrl(key);
          return {
            ...image,
            url: presignedUrl
          };
        } catch (error) {
          console.error(`Failed to generate presigned URL for image ${image.id}:`, error);
          // Return the original image record but with a placeholder/error URL
          return { ...image, url: '/images/placeholder-error.png' }; 
        }
      })
    )

    return NextResponse.json(imagesWithPresignedUrls)
  } catch (error) {
    console.error('API /api/user-images error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
} 