import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
export const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

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

