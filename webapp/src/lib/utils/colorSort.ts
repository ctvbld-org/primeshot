/**
 * Color sorting utilities for creating visually pleasing color palette orders
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): RGB {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, '');
  
  // Parse hex values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }
  
  return {
    h: h * 360,
    s: s * 100,
    l: l * 100
  };
}

/**
 * Convert hex color to HSL
 */
export function hexToHsl(hex: string): HSL {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb);
}

/**
 * Calculate relative luminance of a color (WCAG formula)
 * Returns value between 0 (black) and 1 (white)
 */
function getRelativeLuminance(rgb: RGB): number {
  // Convert to sRGB
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;
  
  // Apply gamma correction
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  // Calculate luminance using WCAG coefficients
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Determine if a color is light (needs dark text) or dark (needs light text)
 * Uses WCAG relative luminance calculation for accurate results
 * @param hex - Hex color string (e.g., "#FFFF00")
 * @returns true if the color is light and needs dark text for contrast
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  const luminance = getRelativeLuminance(rgb);
  
  // Threshold at 0.5 - colors above this are considered "light"
  // Adjust if needed: lower = more colors get dark text, higher = fewer
  return luminance > 0.5;
}

/**
 * Color category definitions for perceptually accurate sorting
 */
enum ColorCategory {
  RED = 0,
  ORANGE = 1,
  YELLOW = 2,
  GREEN = 3,
  CYAN = 4,
  BLUE = 5,
  PURPLE = 6,
  PINK = 7,
  BROWN = 8,
  GRAY = 9,
  WHITE = 10,
  BLACK = 11
}

/**
 * Determine color category based on HSL values
 */
function getColorCategory(hsl: HSL): ColorCategory {
  const { h, s, l } = hsl;
  
  // Very light colors (near white)
  if (l > 95 && s < 10) return ColorCategory.WHITE;
  
  // Very dark colors (near black)
  if (l < 10) return ColorCategory.BLACK;
  
  // Grayscale (very low saturation)
  if (s < 8) return ColorCategory.GRAY;
  
  // Browns: warm hues with low-medium saturation and medium lightness
  // Browns typically fall in orange-yellow range but with muted saturation
  if (s < 40 && l > 20 && l < 60 && h >= 15 && h <= 70) {
    return ColorCategory.BROWN;
  }
  
  // Chromatic colors - categorize by hue
  // Red: 345-360° and 0-15°
  if (h >= 345 || h < 15) return ColorCategory.RED;
  
  // Orange: 15-45°
  if (h >= 15 && h < 45) return ColorCategory.ORANGE;
  
  // Yellow: 45-70°
  if (h >= 45 && h < 70) return ColorCategory.YELLOW;
  
  // Green: 70-170°
  if (h >= 70 && h < 170) return ColorCategory.GREEN;
  
  // Cyan: 170-200°
  if (h >= 170 && h < 200) return ColorCategory.CYAN;
  
  // Blue: 200-260°
  if (h >= 200 && h < 260) return ColorCategory.BLUE;
  
  // Purple: 260-290°
  if (h >= 260 && h < 290) return ColorCategory.PURPLE;
  
  // Pink/Magenta: 290-345°
  if (h >= 290 && h < 345) return ColorCategory.PINK;
  
  return ColorCategory.GRAY;
}

/**
 * Sort colors in rainbow/palette order with improved perceptual accuracy
 * Order: Red → Orange → Yellow → Green → Cyan → Blue → Purple → Pink → Browns → Grays → Black → White
 */
export function sortColorsByPalette<T extends { color?: string }>(colors: T[]): T[] {
  return [...colors].sort((a, b) => {
    const colorA = a.color || '#FFFFFF';
    const colorB = b.color || '#FFFFFF';
    
    const hslA = hexToHsl(colorA);
    const hslB = hexToHsl(colorB);
    
    const categoryA = getColorCategory(hslA);
    const categoryB = getColorCategory(hslB);
    
    // First, sort by color category
    if (categoryA !== categoryB) {
      return categoryA - categoryB;
    }
    
    // Within same category, apply category-specific sorting
    switch (categoryA) {
      case ColorCategory.WHITE:
      case ColorCategory.BLACK:
      case ColorCategory.GRAY:
        // Sort grayscale by lightness (dark to light)
        return hslA.l - hslB.l;
      
      case ColorCategory.BROWN:
        // Sort browns by lightness, then saturation
        if (Math.abs(hslA.l - hslB.l) > 10) {
          return hslA.l - hslB.l;
        }
        return hslB.s - hslA.s; // More saturated first
      
      default:
        // Chromatic colors: sort by hue, then saturation, then lightness
        // Fine-tune ordering within the same hue family
        if (Math.abs(hslA.h - hslB.h) > 3) {
          return hslA.h - hslB.h;
        }
        
        // If hues are very close, prefer more saturated colors
        if (Math.abs(hslA.s - hslB.s) > 5) {
          return hslB.s - hslA.s; // Higher saturation first
        }
        
        // Finally sort by lightness (darker to lighter)
        return hslA.l - hslB.l;
    }
  });
}
