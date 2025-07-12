import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ planName: string }> }
) {
  try {
    const supabase = await createClient()
    const { planName } = await params
    
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('max_face_models')
      .eq('name', planName)
      .single()

    if (error) {
      console.error('Error fetching face model limit:', error)
      return NextResponse.json(
        { error: 'Failed to fetch face model limit' },
        { status: 500 }
      )
    }

    if (!subscription) {
      return NextResponse.json({ limit: 1 }) // Default limit
    }

    return NextResponse.json({ limit: subscription.max_face_models })
  } catch (error) {
    console.error('Error in face model limit API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 