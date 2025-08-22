/**
 * Shared utilities for inference image handling
 */

/**
 * Get the URL for an inference image using the app-images proxy
 * 
 * This function converts S3 paths to proxy URLs that can be used in the frontend
 * to serve private S3 images through our authenticated proxy endpoint.
 * 
 * @param imagePath - The S3 path (with or without s3:// prefix)
 * @param useWebVariant - Whether to use web variant (optional, for future use)
 * @returns Proxy URL for the image
 */
export function getInferenceImageUrl(imagePath: string, useWebVariant: boolean = true): string {
  // Remove s3:// prefix if present
  const cleanPath = imagePath.replace(/^s3:\/\/[^\/]+\//, '');
  
  // Use the app-images proxy endpoint for serving private S3 images
  const proxyUrl = `/api/app-images?path=${encodeURIComponent(cleanPath)}`;
  
  return proxyUrl;
}

/**
 * Extract the base filename from an S3 path
 * 
 * @param imagePath - The S3 path
 * @returns The filename without path
 */
export function getImageFilename(imagePath: string): string {
  const cleanPath = imagePath.replace(/^s3:\/\/[^\/]+\//, '');
  return cleanPath.split('/').pop() || '';
}

/**
 * Check if an image path is a web variant (WebP format)
 * 
 * @param imagePath - The image path to check
 * @returns True if it's a web variant
 */
export function isWebVariant(imagePath: string): boolean {
  return imagePath.toLowerCase().includes('/web/') || imagePath.toLowerCase().endsWith('.webp');
}

/**
 * Check if an image path is an original variant
 * 
 * @param imagePath - The image path to check
 * @returns True if it's an original variant
 */
export function isOriginalVariant(imagePath: string): boolean {
  return imagePath.toLowerCase().includes('/orig/');
}
