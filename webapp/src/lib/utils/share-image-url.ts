import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

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

    // Set expiry to 1 year (matching share link expiry)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const signedUrl = getSignedUrl({
      url: imageUrl,
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
      privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
      dateLessThan: expiryDate.toISOString(),
    });

    return signedUrl;
  } catch (error) {
    console.error('Error creating share image signed URL:', error);
    // Return original URL as fallback
    return imageUrl;
  }
}


