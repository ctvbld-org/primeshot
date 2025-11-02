/**
 * Parse explore image filename to extract metadata
 * Format: {style}__{scene}__{wardrobe}__{color}__{aspectRatio}__{resolution}__{uuid}.webp
 * Example: studio-throne__sunny-mustard-yellow__stat_m_02__black__1-1__2K__a1b2c3d4.webp
 * Note: UUID suffix is optional for backward compatibility
 */

export type AspectRatio = '1:1' | '2:3' | '3:2' | '9:16';

/**
 * Format style name for display
 * Converts "studio-throne" to "Studio Throne"
 */
function formatStyleName(style: string): string {
  // Replace hyphens and underscores with spaces
  const withSpaces = style.replace(/[-_]/g, ' ');
  
  // Capitalize each word
  return withSpaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export interface ExploreImageMetadata {
  filename: string;
  style: string;
  styleFormatted: string; // Properly formatted for display (e.g., "Studio Throne")
  scene: string;
  wardrobe: string;
  color: string;
  aspectRatio: AspectRatio;
  resolution: string;
}

/**
 * Convert aspect ratio from filename format (1-1) to display format (1:1)
 */
function normalizeAspectRatio(ar: string): AspectRatio {
  const normalized = ar.replace(/-/g, ':');
  
  // Validate it's a known aspect ratio
  const validRatios: AspectRatio[] = ['1:1', '2:3', '3:2', '9:16'];
  if (validRatios.includes(normalized as AspectRatio)) {
    return normalized as AspectRatio;
  }
  
  // Default fallback
  return '2:3';
}

/**
 * Parse an explore image filename into structured metadata
 * Returns null if the filename doesn't match the expected pattern
 */
export function parseExploreImageFilename(filename: string): ExploreImageMetadata | null {
  try {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.(webp|jpg|jpeg|png)$/i, '');
    
    // Split by double underscore
    const parts = nameWithoutExt.split('__');
    
    // Expected format: [style, scene, wardrobe, color, aspectRatio, resolution, uuid?]
    // UUID is optional for backward compatibility (6 parts = old format, 7 parts = new format)
    if (parts.length !== 6 && parts.length !== 7) {
      console.warn(`Invalid filename format: ${filename}. Expected 6 or 7 parts, got ${parts.length}`);
      return null;
    }
    
    // Extract parts - ignore UUID if present (last part)
    const [style, scene, wardrobe, color, aspectRatio, resolution] = parts;
    
    // Validate all parts exist
    if (!style || !scene || !wardrobe || !color || !aspectRatio || !resolution) {
      console.warn(`Missing parts in filename: ${filename}`);
      return null;
    }
    
    return {
      filename,
      style,
      styleFormatted: formatStyleName(style),
      scene,
      wardrobe,
      color,
      aspectRatio: normalizeAspectRatio(aspectRatio),
      resolution
    };
  } catch (error) {
    console.error(`Error parsing filename ${filename}:`, error);
    return null;
  }
}

