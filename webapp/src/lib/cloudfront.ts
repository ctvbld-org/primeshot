import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

function isCloudFrontDistribution(url = process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || '') {
  return /cloudfront\.net|cdn\.primeshot\.ai/i.test(url);
}

export const getCloudFrontSignedUrl = async (key: string) => {
  const distribution = (process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || '').replace(/\/$/, '');
  const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
  const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;

  if (!distribution || !isCloudFrontDistribution(distribution) || !keyPairId || !privateKey) {
    throw new Error('CloudFront signing is not configured');
  }

  try {
    const url = `${distribution}/${key}`;

    return getSignedUrl({
      url,
      keyPairId,
      privateKey,
      dateLessThan: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error creating CloudFront signed URL:', error);
    throw error;
  }
};
