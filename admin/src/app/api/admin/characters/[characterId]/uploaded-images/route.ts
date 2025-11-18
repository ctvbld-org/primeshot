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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const { characterId } = await params

    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('uploaded_images')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching uploaded images:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Convert image URLs to thumbnail API URLs
    const imagesWithCdnUrls = data.map(image => ({
      ...image,
      url: getThumbUrl(image.url, 640)
    }))

    return NextResponse.json({ data: imagesWithCdnUrls })
  } catch (err) {
    console.error('Error in training images API:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

