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
    
    // Return the full proxy URL
    return `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/placeholders/styles/${img}`;
  });
}

export default getStyleImages; 