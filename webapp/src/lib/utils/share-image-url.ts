import { getCloudFrontSignedUrl } from '../cloudfront';

/**
 * Extract S3 path from app-images URL
 * Example: /create/api/app-images?path=user-images%2F... -> user-images/...
 */
function extractS3Path(imageUrl: string): string | null {
  try {
    // Handle relative paths like /create/api/app-images?path=...
    if (imageUrl.includes('/app-images')) {
      const url = new URL(imageUrl, 'http://dummy.com');
      const pathParam = url.searchParams.get('path');
      if (pathParam) {
        return decodeURIComponent(pathParam);
      }
    }
    
    // If already a full CloudFront URL, extract the path
    if (imageUrl.includes(process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || '')) {
      const url = new URL(imageUrl);
      return url.pathname.substring(1); // Remove leading slash
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting S3 path:', error);
    return null;
  }
}

/**
 * Generate a long-lived CloudFront signed URL for share links
 * Reuses the existing getCloudFrontSignedUrl but with 1 year expiry
 */
export async function getShareImageSignedUrl(imageUrl: string): Promise<string> {
  try {
    // Check if CloudFront signing is configured
    if (!process.env.CLOUDFRONT_KEY_PAIR_ID || !process.env.CLOUDFRONT_PRIVATE_KEY) {
      console.warn('CloudFront signing not configured, returning original URL');
      return imageUrl;
    }

    // Extract S3 path from the image URL
    const s3Path = extractS3Path(imageUrl);
    if (!s3Path) {
      console.warn('Could not extract S3 path from image URL:', imageUrl);
      return imageUrl;
    }

    console.log('Extracted S3 path:', s3Path);

    // Use the existing working CloudFront signing function
    const signedUrl = await getCloudFrontSignedUrl(s3Path);

    console.log('Successfully generated signed URL');
    return signedUrl;
  } catch (error) {
    console.error('Error creating share image signed URL:', error);
    // Return original URL as fallback
    return imageUrl;
  }
}


