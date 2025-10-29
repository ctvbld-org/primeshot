import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { createSecuredHandler, SECURITY_PRESETS } from '@/lib/security-middleware';

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

async function handlePOST(request: NextRequest) {
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

    // Delete any uploaded_images rows tied to this failed uploadId
    // We use file_name pattern `${uploadId}-*` or URL containing `/${uploadId}-`
    try {
      const deleteByFileName = supabase
        .from('uploaded_images')
        .delete()
        .eq('user_id', user.id)
        .like('file_name', `${uploadId}-%`);

      const deleteByUrl = supabase
        .from('uploaded_images')
        .delete()
        .eq('user_id', user.id)
        .ilike('url', `%/${uploadId}-%`);

      const [byNameRes, byUrlRes] = await Promise.all([deleteByFileName, deleteByUrl]);
      if (byNameRes.error) {
        console.error('Error deleting uploaded_images by file_name:', byNameRes.error);
      }
      if (byUrlRes.error) {
        console.error('Error deleting uploaded_images by url:', byUrlRes.error);
      }
    } catch (e) {
      console.error('Unexpected error deleting uploaded_images for failed upload:', e);
    }

    // Clean up temporary files
    await cleanupTempFiles(uploadId);

    return NextResponse.json({ 
      success: true, 
      message: 'Cleaned uploaded_images rows and temp files for failed upload' 
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error during cleanup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleGET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Unauthorized access attempt', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Legacy upload_sessions cleanup removed. No-op, but keep endpoint for compatibility.
    return NextResponse.json({ success: true, message: 'No-op cleanup. Legacy upload sessions removed.' });

  } catch (error) {
    console.error('Cleanup error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error during cleanup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 

// Secured handlers with authentication and rate limiting
const securedPOST = createSecuredHandler(
  handlePOST,
  SECURITY_PRESETS.PUBLIC
);

const securedGET = createSecuredHandler(
  handleGET,
  SECURITY_PRESETS.PUBLIC
);

export async function POST(request: NextRequest) {
  return await securedPOST(request);
}

export async function GET(request: NextRequest) {
  return await securedGET(request);
}