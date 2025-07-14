import { Gender } from '../types';

// Use the proxy endpoint instead of direct S3 access
const getProxyUrl = (path: string) => {
  return `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/${path}`;
};

/**
 * Returns the set of images from the styles placeholders directory
 * Uses a fixed path for all style images
 *
 * @param images The image filenames
 * @returns Array of images with full URLs from S3 via proxy
 */
export function getStyleImages(
  images: string[]
): string[] {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return [];
  }
  
  // Map each image to its gender-specific path
  return images.map(img => {
    // If image already has a complete URL (https://...), return as is
    if (img.startsWith('http')) return img;
    
    // Create the S3 path - place in the placeholders/gender subfolder
    const s3Path = `app-images/placeholders/styles/${img}`;
    
    // Return the proxy URL
    return getProxyUrl(s3Path);
  });
}

export default getStyleImages; 