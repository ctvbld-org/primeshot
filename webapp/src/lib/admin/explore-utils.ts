import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/s3';

/**
 * Verify that the current user is an admin
 */
export async function requireAdmin(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('admin')
    .eq('id', user.id)
    .single();

  if (userError || userData?.admin !== true) {
    return NextResponse.json(
      { success: false, error: 'Admin access required' },
      { status: 403 }
    );
  }

  return { supabase, userId: user.id };
}

/**
 * Copy an image from one S3 location to another using AWS S3 native copy
 */
export async function copyS3Image(
  sourcePath: string,
  destinationPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const bucket = process.env.AWS_S3_BUCKET!;
    
    // Source path should be used as-is (includes user-images/ prefix in S3)
    // Destination needs app-images/ prefix
    const cleanDestinationPath = destinationPath.startsWith('app-images/')
      ? destinationPath
      : `app-images/${destinationPath}`;
    
    console.log('S3 Copy - Source:', sourcePath, 'Destination:', cleanDestinationPath, 'Bucket:', bucket);
    
    // Use S3 CopyObject command
    const copyCommand = new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${sourcePath}`,
      Key: cleanDestinationPath,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable'
    });

    await s3Client.send(copyCommand);

    console.log('S3 copy successful!');
    return { success: true };
  } catch (error) {
    console.error('Error in copyS3Image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `S3 copy failed: ${errorMessage}` };
  }
}

/**
 * Delete an image from S3
 */
export async function deleteS3Image(
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const bucket = process.env.AWS_S3_BUCKET!;
    
    // Add 'app-images/' prefix if not present
    const cleanPath = path.startsWith('app-images/')
      ? path
      : `app-images/${path}`;
    
    console.log('S3 Delete - Path:', cleanPath, 'Bucket:', bucket);
    
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: cleanPath
    });

    await s3Client.send(deleteCommand);

    return { success: true };
  } catch (error) {
    console.error('Error in deleteS3Image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `S3 delete failed: ${errorMessage}` };
  }
}

/**
 * Generate a filename for explore image
 * Format: [style-name]-[timestamp].webp
 */
export function generateExploreFilename(styleName: string): string {
  // Normalize style name: lowercase, replace spaces with hyphens
  const normalizedName = styleName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Generate timestamp to the second
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .split('.')[0]; // Remove milliseconds

  return `${normalizedName}-${timestamp}.webp`;
}

/**
 * Get destination path for explore image
 * Note: Returns path WITHOUT app-images/ prefix since that's added by getWebsiteCdnUrl
 */
export function getExploreImagePath(filename: string): string {
  return `placeholders/styles/${filename}`;
}

/**
 * Update styles.preview_images array
 */
export async function updateStylePreviewImages(
  styleId: string,
  filename: string,
  action: 'add' | 'remove'
) {
  const supabase = await createClient();

  // Get current preview_images
  const { data: style, error: fetchError } = await supabase
    .from('styles')
    .select('preview_images')
    .eq('id', styleId)
    .single();

  if (fetchError) {
    console.error('Error fetching style:', fetchError);
    return { success: false, error: 'Failed to fetch style' };
  }

  let previewImages: string[] = Array.isArray(style?.preview_images) 
    ? style.preview_images 
    : [];

  if (action === 'add') {
    // Add if not already present
    if (!previewImages.includes(filename)) {
      previewImages.push(filename);
    }
  } else {
    // Remove if present
    previewImages = previewImages.filter(img => img !== filename);
  }

  // Update style
  const { error: updateError } = await supabase
    .from('styles')
    .update({ preview_images: previewImages })
    .eq('id', styleId);

  if (updateError) {
    console.error('Error updating style preview_images:', updateError);
    return { success: false, error: 'Failed to update style preview_images' };
  }

  return { success: true };
}

