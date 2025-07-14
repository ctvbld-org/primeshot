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

/**
 * Gets just the first image from the gender-appropriate set
 * Useful for thumbnails or preview cards
 * 
 * @param images The image filenames
 * @param gender The user's gender
 * @returns First image with gender-specific path
 */
export function getStyleThumbnail(
  images: string[],
  gender?: Gender
): string {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return '';
  }
  
  const imageSet = getStyleImages(images);
  return imageSet[0] || '';
}

/**
 * Filters styles based on user gender
 * Only returns styles that are available for the user's gender
 * 
 * @param styles Array of style objects with availableGenders property
 * @param gender The user's gender (defaults to showing all styles if undefined)
 * @returns Filtered array of styles
 */
export function filterStylesByGender<T extends { availableGenders?: Gender[] }>(
  styles: T[],
  gender?: Gender
): T[] {
  if (!gender) {
    return styles; // Return all styles if no gender specified
  }

  return styles.filter(style => {
    // If no availableGenders specified, style is available to all
    if (!style.availableGenders || style.availableGenders.length === 0) {
      return true;
    }
    
    // Check if user's gender is in the availableGenders array
    return style.availableGenders.includes(gender);
  });
}

// For backward compatibility with old imports
export const getGenderImages = getStyleImages;
export const getGenderThumbnail = getStyleThumbnail;

export default getStyleImages; 