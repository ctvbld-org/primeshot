import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ inferenceId: string }> }
) {
  try {
    const { inferenceId } = await params

    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('inference_id', inferenceId)
      .order('image_index', { ascending: true })

    if (error) {
      console.error('Error fetching generated images:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Fetched ${data.length} generated images for inference ${inferenceId}`)

    // Return raw data - let client handle URL building
    return NextResponse.json({ data })
  } catch (err) {
    console.error('Error in generated images API:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

