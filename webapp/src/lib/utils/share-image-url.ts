import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

/**
 * Extract S3 path from app-images URL and convert to full CloudFront URL
 * Example: /create/api/app-images?path=user-images%2F... -> https://cdn.../user-images/...
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
 * Format private key from environment variable
 * Handles both inline keys (with \n) and properly formatted PEM keys
 */
function formatPrivateKey(key: string): string {
  // If key already has actual newlines, return as-is
  if (key.includes('\n') && !key.includes('\\n')) {
    return key;
  }
  
  // Replace literal \n with actual newlines
  return key.replace(/\\n/g, '\n');
}

/**
 * Generate a long-lived CloudFront signed URL for share links
 * These URLs expire in 1 year to match share link expiry
 */
export async function getShareImageSignedUrl(imageUrl: string): Promise<string> {
  try {
    // Check if CloudFront signing is configured
    if (!process.env.CLOUDFRONT_KEY_PAIR_ID || !process.env.CLOUDFRONT_PRIVATE_KEY) {
      console.warn('CloudFront signing not configured, returning original URL');
      return imageUrl;
    }
    
    if (!process.env.NEXT_PUBLIC_AWS_DISTRIBUTION) {
      console.warn('NEXT_PUBLIC_AWS_DISTRIBUTION not configured');
      return imageUrl;
    }

    // Extract S3 path from the image URL
    const s3Path = extractS3Path(imageUrl);
    if (!s3Path) {
      console.warn('Could not extract S3 path from image URL:', imageUrl);
      return imageUrl;
    }

    // Construct full CloudFront URL
    const cloudFrontUrl = `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/${s3Path}`;
    console.log('Constructing CloudFront URL:', cloudFrontUrl);

    // Format the private key (handle \n escaping)
    const privateKey = formatPrivateKey(process.env.CLOUDFRONT_PRIVATE_KEY);

    // Set expiry to 1 year (matching share link expiry)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const signedUrl = getSignedUrl({
      url: cloudFrontUrl,
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
      privateKey: privateKey,
      dateLessThan: expiryDate.toISOString(),
    });

    console.log('Successfully generated signed URL');
    return signedUrl;
  } catch (error) {
    console.error('Error creating share image signed URL:', error);
    // Return original URL as fallback
    return imageUrl;
  }
}


