import { S3Client, CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Extract S3 key from app-images URL
 * Example: /create/api/app-images?path=user-images%2F... -> user-images/...
 */
function extractS3Key(imageUrl: string): string | null {
  try {
    if (imageUrl.includes('/app-images')) {
      const url = new URL(imageUrl, 'http://dummy.com');
      const pathParam = url.searchParams.get('path');
      if (pathParam) {
        return decodeURIComponent(pathParam);
      }
    }
    return null;
  } catch (error) {
    console.error('Error extracting S3 key:', error);
    return null;
  }
}

/**
 * Copy a user-generated image to a public S3 path for sharing
 * @param imageUrl - The original image URL (from app-images)
 * @param shortCode - The short code for the share link
 * @returns The public CloudFront URL of the copied image
 */
export async function copyImageToPublic(imageUrl: string, shortCode: string): Promise<string> {
  try {
    const bucketName = process.env.AWS_S3_BUCKET;
    const distribution = process.env.NEXT_PUBLIC_AWS_DISTRIBUTION;
    
    if (!bucketName || !distribution) {
      throw new Error('S3 bucket or CloudFront distribution not configured');
    }

    // Extract the original S3 key
    const sourceKey = extractS3Key(imageUrl);
    if (!sourceKey) {
      throw new Error('Could not extract S3 key from image URL');
    }

    console.log('Copying image from:', sourceKey);

    // Verify source object exists
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: bucketName,
        Key: sourceKey,
      }));
    } catch (error) {
      console.error('Source object not found:', sourceKey);
      throw new Error('Source image not found');
    }

    // Generate destination key with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const fileName = sourceKey.split('/').pop() || 'image.png';
    const destinationKey = `website-images/user-shared/${shortCode}-${timestamp}-${fileName}`;

    console.log('Copying to:', destinationKey);

    // Copy the object to the public path
    await s3Client.send(new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: `${bucketName}/${sourceKey}`,
      Key: destinationKey,
      ACL: 'public-read', // Make it publicly accessible
      MetadataDirective: 'COPY',
    }));

    // Return the public CloudFront URL
    const publicUrl = `${distribution}/${destinationKey}`;
    console.log('Image copied successfully to:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('Error copying image to public S3:', error);
    throw error;
  }
}

