import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

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
      .order('created_at', { ascending: true})

    if (error) {
      console.error('Error fetching uploaded images:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Fetched ${data.length} uploaded images for character ${characterId}`)

    // Return raw data - let client handle URL building
    return NextResponse.json({ data })
  } catch (err) {
    console.error('Error in training images API:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

