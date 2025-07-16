import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient()
    const { id } = await params
    const body = await request.json()
    
    const { error } = await supabase
      .from('credit_packs')
      .update(body)
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating credit pack:', error)
    return NextResponse.json(
      { error: 'Failed to update credit pack' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient()
    const { id } = await params
    
    const { error } = await supabase
      .from('credit_packs')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting credit pack:', error)
    return NextResponse.json(
      { error: 'Failed to delete credit pack' },
      { status: 500 }
    )
  }
} 