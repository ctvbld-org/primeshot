import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: styleId } = await params

    console.log('DELETE request for style ID:', styleId)

    // First, fetch the style to get its preview_images - using array query instead of single
    const { data: styles, error: fetchError } = await supabase
      .from('styles')
      .select('preview_images')
      .eq('id', styleId)

    if (fetchError) {
      console.error('Error fetching style:', {
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        code: fetchError.code
      })
      return NextResponse.json(
        { error: 'Database error', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!styles || styles.length === 0) {
      console.log('No styles found with ID:', styleId)
      return NextResponse.json(
        { error: 'Style not found' },
        { status: 404 }
      )
    }

    const style = styles[0]
    console.log('Successfully fetched style:', style)

    // Extract image filenames from preview_images
    const imageFilenames = (style.preview_images as string[]) || []
    
    // Delete the style record first
    const { error: deleteError } = await supabase
      .from('styles')
      .delete()
      .eq('id', styleId)

    if (deleteError) {
      console.error('Error deleting style:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete style' },
        { status: 500 }
      )
    }

    // Note: Do NOT delete S3 images here to avoid cross-environment data loss
    return NextResponse.json({ 
      success: true, 
      message: 'Style deleted successfully (images retained on S3)'
    })

  } catch (error) {
    console.error('Delete style error:', error)
    return NextResponse.json(
      { error: 'Failed to delete style and images' },
      { status: 500 }
    )
  }
} 