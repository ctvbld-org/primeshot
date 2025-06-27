import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

if (!process.env.CLOUDFRONT_KEY_PAIR_ID || !process.env.CLOUDFRONT_PRIVATE_KEY) {
  throw new Error('CloudFront signing credentials are not properly configured');
}

export const getCloudFrontSignedUrl = async (key: string) => {
  try {
    const url = `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/${key}`;
    
    const signedUrl = getSignedUrl({
      url,
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID as string,
      privateKey: process.env.CLOUDFRONT_PRIVATE_KEY as string,
      dateLessThan: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
    });

    return signedUrl;
  } catch (error) {
    console.error('Error creating CloudFront signed URL:', error);
    throw error;
  }
}; 