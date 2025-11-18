import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

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
      .from('training_jobs')
      .select(`
        *,
        character:characters(
          id,
          name,
          thumbnail_url,
          lora_path,
          metadata,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit)

    if (error) {
      console.error('Error fetching training jobs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const hasMore = data.length > limit
    const jobs = hasMore ? data.slice(0, limit) : data

    // Return raw data - let client handle URL building
    return NextResponse.json({
      data: jobs,
      hasMore
    })
  } catch (err) {
    console.error('Error in training jobs API:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

