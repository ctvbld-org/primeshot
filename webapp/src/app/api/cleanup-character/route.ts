import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteCharacterFolder } from '@/lib/s3'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Unauthorized cleanup attempt', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { characterId } = await request.json()

    if (!characterId) {
      return NextResponse.json({ error: 'Character ID is required' }, { status: 400 })
    }

    console.log(`Starting cleanup for character: ${characterId}`)

    // Verify the character belongs to the user and is not already deleted
    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('id, user_id, status')
      .eq('id', characterId)
      .eq('user_id', user.id)
      .neq('status', 'deleted') // Only allow deletion of non-deleted models
      .single()

    if (characterError || !character) {
      console.error('Character not found, access denied, or already deleted:', characterError)
      return NextResponse.json({ error: 'Character not found or access denied' }, { status: 404 })
    }

    // Delete entire character folder from S3 (includes all images)
    console.log(`Deleting character folder from S3: user-images/${user.id}/${characterId}/`)
    const s3Result = await deleteCharacterFolder(characterId, user.id)
    
    if (s3Result.success) {
      console.log(`✅ Successfully deleted ${s3Result.deletedCount} objects from S3`)
    } else {
      console.warn(`⚠️ S3 cleanup completed with ${s3Result.errors.length} errors:`, s3Result.errors)
      // Continue with database cleanup even if S3 has issues
    }

    // Delete images from database
    const { error: deleteImagesError } = await supabase
      .from('images')
      .delete()
      .eq('character_id', characterId)

    if (deleteImagesError) {
      console.error('Failed to delete images from database:', deleteImagesError)
      // Continue with character deletion
    } else {
      console.log(`Deleted images from database for character: ${characterId}`)
    }

    // Delete upload sessions and chunks
    const { error: deleteSessionsError } = await supabase
      .from('upload_sessions')
      .delete()
      .eq('character_id', characterId)

    if (deleteSessionsError) {
      console.error('Failed to delete upload sessions:', deleteSessionsError)
      // Continue with character deletion
    }

    // Note: We keep training_jobs for analytics and audit trail
    // The soft delete approach maintains referential integrity

    // Soft delete the character (set status to 'deleted' instead of removing record)
    const { error: deleteCharacterError } = await supabase
      .from('characters')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', characterId)
      .eq('user_id', user.id)
      .neq('status', 'deleted') // Extra safety check - don't delete already deleted models

    if (deleteCharacterError) {
      console.error('Failed to soft delete character:', deleteCharacterError)
      return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 })
    }

    console.log(`Successfully soft deleted character: ${characterId}`)
    return NextResponse.json({ success: true, message: 'Character deleted successfully' })

  } catch (error) {
    console.error('Error during character cleanup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 