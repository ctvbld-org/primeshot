import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// UUID v4 validation regex
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function cleanupTempFiles(uploadId: string) {
  try {
    if (!UUID_V4_REGEX.test(uploadId)) {
      throw new Error('Invalid uploadId format');
    }
    const tempDir = path.join(os.tmpdir(), 'primeshot-uploads', uploadId);
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to cleanup temp files for upload ${uploadId}:`, error);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Unauthorized access attempt', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uploadId } = await request.json();

    if (!uploadId) {
      return NextResponse.json({ error: 'Upload ID is required' }, { status: 400 });
    }

    // Validate uploadId format
    if (!UUID_V4_REGEX.test(uploadId)) {
      return NextResponse.json({ error: 'Invalid upload ID format' }, { status: 400 });
    }

    // Get the upload session to verify ownership
    const { data: session } = await supabase
      .from('upload_sessions')
      .select('id, user_id')
      .eq('id', uploadId)
      .eq('user_id', user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Upload session not found or access denied' }, { status: 404 });
    }

    // Delete chunks first (due to foreign key constraint)
    const { error: deleteChunksError } = await supabase
      .from('upload_chunks')
      .delete()
      .eq('session_id', uploadId);

    if (deleteChunksError) {
      console.error('Error deleting chunks:', deleteChunksError);
      return NextResponse.json({ error: 'Failed to cleanup chunks' }, { status: 500 });
    }

    // Delete the upload session
    const { error: deleteSessionError } = await supabase
      .from('upload_sessions')
      .delete()
      .eq('id', uploadId)
      .eq('user_id', user.id);

    if (deleteSessionError) {
      console.error('Error deleting session:', deleteSessionError);
      return NextResponse.json({ error: 'Failed to cleanup session' }, { status: 500 });
    }

    // Clean up temporary files
    await cleanupTempFiles(uploadId);

    return NextResponse.json({ 
      success: true, 
      message: 'Upload session and chunks cleaned up successfully' 
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error during cleanup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET endpoint to cleanup old failed uploads (can be called periodically)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Unauthorized access attempt', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find failed or stale upload sessions (older than 1 hour and not completed)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: staleSessions, error: fetchError } = await supabase
      .from('upload_sessions')
      .select('id')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .lt('created_at', oneHourAgo);

    if (fetchError) {
      console.error('Error fetching stale sessions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch stale sessions' }, { status: 500 });
    }

    let cleanedCount = 0;

    if (staleSessions && staleSessions.length > 0) {
      for (const session of staleSessions) {
        try {
          // Delete chunks first
          await supabase
            .from('upload_chunks')
            .delete()
            .eq('session_id', session.id);

          // Delete session
          await supabase
            .from('upload_sessions')
            .delete()
            .eq('id', session.id)
            .eq('user_id', user.id);

          // Clean up temp files
          await cleanupTempFiles(session.id);
          
          cleanedCount++;
        } catch (error) {
          console.error(`Failed to cleanup session ${session.id}:`, error);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${cleanedCount} stale upload sessions` 
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error during cleanup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 