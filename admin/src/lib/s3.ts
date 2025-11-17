import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Create presigned URL for reading/downloading from S3
 */
export async function createPresignedGetUrl(key: string): Promise<string> {
  try {
    const bucket = process.env.AWS_S3_BUCKET || process.env.NEXT_PUBLIC_AWS_S3_BUCKET
    
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is not configured')
    }
    
    // Handle full URLs (extract just the path part)
    if (key.startsWith('http')) {
      try {
        const url = new URL(key);
        // Extract the path and remove leading slash
        let path = url.pathname.substring(1);
        
        // If path contains bucket name, remove it
        if (path.startsWith(`${bucket}/`)) {
          path = path.substring(bucket.length + 1);
        }
        
        key = path;
      } catch (e) {
        console.warn('Failed to parse URL, using as-is:', key);
      }
    }
    
    // Make sure we have a valid key after potential URL parsing
    if (!key) {
      throw new Error('Invalid key provided for presigned URL');
    }
    
    // For S3 presigned URLs
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
  } catch (error) {
    console.error('Error creating presigned URL:', error);
    throw error;
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
    
    // Add 'app-images/' prefix if not present (explore images are in app-images bucket)
    const cleanPath = path.startsWith('app-images/')
      ? path
      : `app-images/${path}`;
    
    console.log('S3 Delete - Path:', cleanPath, 'Bucket:', bucket);
    
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: cleanPath
    });

    await s3Client.send(deleteCommand);

    console.log('S3 delete successful!');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteS3Image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `S3 delete failed: ${errorMessage}` };
  }
}

