import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteFromS3 } from '@/lib/s3'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Unauthorized cleanup attempt', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { faceModelId } = await request.json()

    if (!faceModelId) {
      return NextResponse.json({ error: 'Face model ID is required' }, { status: 400 })
    }

    console.log(`Starting cleanup for face model: ${faceModelId}`)

    // Verify the face model belongs to the user and is not already deleted
    const { data: faceModel, error: faceModelError } = await supabase
      .from('face_models')
      .select('id, user_id, status')
      .eq('id', faceModelId)
      .eq('user_id', user.id)
      .neq('status', 'deleted') // Only allow deletion of non-deleted models
      .single()

    if (faceModelError || !faceModel) {
      console.error('Face model not found, access denied, or already deleted:', faceModelError)
      return NextResponse.json({ error: 'Face model not found or access denied' }, { status: 404 })
    }

    // Get all images associated with this face model
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('id, url')
      .eq('face_model_id', faceModelId)

    if (imagesError) {
      console.error('Failed to fetch face model images:', imagesError)
      // Continue with cleanup even if we can't fetch images
    }

    // Delete images from S3
    if (images && images.length > 0) {
      console.log(`Deleting ${images.length} images from S3`)
      for (const image of images) {
        try {
          // Extract S3 key from URL
          const url = new URL(image.url)
          const key = url.pathname.substring(1) // Remove leading slash
          await deleteFromS3(key)
          console.log(`Deleted S3 object: ${key}`)
        } catch (s3Error) {
          console.error(`Failed to delete S3 object for image ${image.id}:`, s3Error)
          // Continue with other deletions
        }
      }
    }

    // Delete images from database
    if (images && images.length > 0) {
      const { error: deleteImagesError } = await supabase
        .from('images')
        .delete()
        .eq('face_model_id', faceModelId)

      if (deleteImagesError) {
        console.error('Failed to delete images from database:', deleteImagesError)
        // Continue with face model deletion
      } else {
        console.log(`Deleted ${images.length} images from database`)
      }
    }

    // Delete upload sessions and chunks
    const { error: deleteSessionsError } = await supabase
      .from('upload_sessions')
      .delete()
      .eq('face_model_id', faceModelId)

    if (deleteSessionsError) {
      console.error('Failed to delete upload sessions:', deleteSessionsError)
      // Continue with face model deletion
    }

    // Note: We keep training_jobs for analytics and audit trail
    // The soft delete approach maintains referential integrity

    // Soft delete the face model (set status to 'deleted' instead of removing record)
    const { error: deleteFaceModelError } = await supabase
      .from('face_models')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', faceModelId)
      .eq('user_id', user.id)
      .neq('status', 'deleted') // Extra safety check - don't delete already deleted models

    if (deleteFaceModelError) {
      console.error('Failed to soft delete face model:', deleteFaceModelError)
      return NextResponse.json({ error: 'Failed to delete face model' }, { status: 500 })
    }

    console.log(`Successfully soft deleted face model: ${faceModelId}`)
    return NextResponse.json({ success: true, message: 'Face model deleted successfully' })

  } catch (error) {
    console.error('Error during face model cleanup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 