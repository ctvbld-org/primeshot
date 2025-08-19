/**
 * Utility functions to resolve inference-generated images at optimal resolutions
 * 
 * Similar to admin's multi-resolution system, this provides automatic
 * resolution selection based on usage context.
 */

export interface InferenceImageOptions {
  /** Target display width in pixels (image will be sized appropriately) */
  width?: number;
  /** Force a specific variant size */
  size?: 320 | 640 | 1024;
  /** Get original high-res version instead of web variant */
  original?: boolean;
}

/**
 * Get the optimal inference image URL for a given context
 * 
 * @param baseUrl The base web image URL (e.g., from database: user-images/.../web/filename.webp)
 * @param options Resolution and format options
 * @returns Optimized image URL with correct resolution
 */
export function getInferenceImage(baseUrl: string, options: InferenceImageOptions = {}): string {
  if (!baseUrl) return '';
  
  // If requesting original, swap /web/ for /orig/ and change extension to .png
  if (options.original) {
    return baseUrl.replace('/web/', '/orig/').replace(/\.webp$/, '.png');
  }
  
  // If already a full URL or not a web variant, return as-is
  if (baseUrl.startsWith('http') && !baseUrl.includes('/web/')) {
    return baseUrl;
  }
  
  // Determine optimal size based on target width or explicit size
  let targetSize: number;
  
  if (options.size) {
    targetSize = options.size;
  } else if (options.width) {
    // Choose optimal size based on target display width
    // Account for high-DPI displays (2x scaling)
    const effectiveWidth = options.width * (window.devicePixelRatio || 1);
    
    if (effectiveWidth <= 320) {
      targetSize = 320;
    } else if (effectiveWidth <= 640) {
      targetSize = 640;
    } else {
      targetSize = 1024;
    }
  } else {
    // Default to base size (1024px)
    targetSize = 1024;
  }
  
  // If requesting base size (1024px), return the base URL as-is
  if (targetSize === 1024) {
    return baseUrl;
  }
  
  // For smaller sizes, insert the -w{size} suffix before .webp
  return baseUrl.replace(/\.webp$/, `-w${targetSize}.webp`);
}

/**
 * Get inference image optimized for thumbnail display (320px)
 */
export function getInferenceImageThumbnail(baseUrl: string): string {
  return getInferenceImage(baseUrl, { size: 320 });
}

/**
 * Get inference image optimized for card display (640px)
 */
export function getInferenceImageCard(baseUrl: string): string {
  return getInferenceImage(baseUrl, { size: 640 });
}

/**
 * Get inference image optimized for large display (1024px - base size)
 */
export function getInferenceImageLarge(baseUrl: string): string {
  return getInferenceImage(baseUrl, { size: 1024 });
}

/**
 * Get original high-resolution inference image (PNG format)
 */
export function getInferenceImageOriginal(baseUrl: string): string {
  return getInferenceImage(baseUrl, { original: true });
}

/**
 * Get inference image with responsive sizing based on container width
 * 
 * @param baseUrl Base image URL
 * @param containerWidth Expected container width in CSS pixels
 * @returns Optimized image URL
 */
export function getInferenceImageResponsive(baseUrl: string, containerWidth: number): string {
  return getInferenceImage(baseUrl, { width: containerWidth });
}

/**
 * Generate srcSet for responsive images
 * 
 * @param baseUrl Base image URL
 * @returns srcSet string for responsive images
 */
export function getInferenceImageSrcSet(baseUrl: string): string {
  if (!baseUrl) return '';
  
  const sizes = [320, 640, 1024];
  
  return sizes
    .map(size => {
      const url = getInferenceImage(baseUrl, { size: size as any });
      return `${url} ${size}w`;
    })
    .join(', ');
}

export default getInferenceImage;
