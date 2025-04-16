import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPresignedGetUrl } from '@/lib/s3'
import { Database } from '@/types/supabase'

type ImageRecord = Database['public']['Tables']['images']['Row']

// GET handler to retrieve presigned URLs for images
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(request.url)
    const imageId = url.searchParams.get('imageId')
    const userId = url.searchParams.get('userId')

    // Create Supabase client
    const supabase = await createClient()

    // Get current user for authorization
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Set up query based on parameters
    let query = supabase.from('images').select('*')
    
    if (imageId) {
      // If imageId is provided, get just that image (but still check ownership)
      query = query.eq('id', imageId).eq('user_id', user.id)
    } else {
      // Otherwise, get all images for the current user
      query = query.eq('user_id', user.id)
        .order('created_at', { ascending: false }) // Sort by most recent first
    }

    // Execute query
    const { data: images, error } = await query

    if (error) {
      console.error('Database error:', error)
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
          let key;
          try {
            const url = new URL(image.url);
            // Remove leading slash and potentially the bucket name part of the path
            key = url.pathname.substring(1);
            
            // If the URL includes the bucket name in the path, extract just the key part
            const bucketName = process.env.AWS_S3_BUCKET;
            if (bucketName && key.startsWith(bucketName + '/')) {
              key = key.substring(bucketName.length + 1);
            }
          } catch (urlError) {
            // If URL parsing fails, try to extract key based on common S3 URL patterns
            console.error(`Failed to parse URL: ${image.url}`, urlError);
            // Example: https://bucket-name.s3.region.amazonaws.com/folder/file.jpg
            const parts = image.url.split('.amazonaws.com/');
            if (parts.length > 1) {
              key = parts[1];
            } else {
              // Fall back to using the entire URL as the key
              key = image.url;
            }
          }
          
          const presignedUrl = await createPresignedGetUrl(key);
          return {
            ...image,
            url: presignedUrl
          };
        } catch (error) {
          console.error(`Failed to generate presigned URL for image ${image.id}:`, error);
          return image; // Return original URL if presigned URL generation fails
        }
      })
    )

    return NextResponse.json(imagesWithPresignedUrls)
  } catch (error) {
    console.error('Unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 