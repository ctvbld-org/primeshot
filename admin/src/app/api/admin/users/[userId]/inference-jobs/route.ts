import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Convert S3 keys/URLs to CloudFront CDN URLs for placeholder images
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
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { searchParams } = new URL(req.url)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('inference_jobs')
      .select(`
        *,
        style:styles(
          id,
          name,
          preview_images
        ),
        wardrobe:style_wardrobes(
          id,
          label,
          image
        ),
        scene:style_scenes(
          id,
          label,
          image
        ),
        color:style_colors(
          id,
          label,
          value,
          color
        ),
        character:characters(
          id,
          name,
          thumbnail_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit)

    if (error) {
      console.error('Error fetching inference jobs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const hasMore = data.length > limit
    const jobs = hasMore ? data.slice(0, limit) : data

    // Convert placeholder images to CDN URLs (style previews, wardrobes, scenes)
    // But keep character thumbnails as raw S3 URLs for client-side processing
    const jobsWithCdnUrls = jobs.map(job => {
      const converted: any = { ...job }

      // Keep character thumbnail_url as-is (client will convert to thumbnail API URL)
      // No modification needed for character.thumbnail_url

      // Convert style preview images (these are CDN placeholders, not S3)
      if (job.style?.preview_images && Array.isArray(job.style.preview_images)) {
        converted.style = {
          ...job.style,
          preview_images: job.style.preview_images.map((img: string | null) =>
            img ? toCdnUrl(`app-images/placeholders/styles/${img}`) : null
          )
        }
      }

      // Convert wardrobe placeholder image (CDN)
      if (job.wardrobe?.image) {
        converted.wardrobe = {
          ...job.wardrobe,
          image: toCdnUrl(`app-images/placeholders/options/wardrobes/${job.wardrobe.image}`)
        }
      }

      // Convert scene placeholder image (CDN)
      if (job.scene?.image) {
        converted.scene = {
          ...job.scene,
          image: toCdnUrl(`app-images/placeholders/options/scenes/${job.scene.image}`)
        }
      }

      return converted
    })

    return NextResponse.json({
      data: jobsWithCdnUrls,
      hasMore
    })
  } catch (err) {
    console.error('Error in inference jobs API:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

