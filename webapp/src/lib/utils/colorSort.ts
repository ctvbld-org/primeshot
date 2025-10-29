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
  // Covers orange-browns (30-60°) and yellow-browns (60-80°)
  // More permissive saturation threshold (< 50%) and wider lightness range
  if (s < 50 && l > 15 && l < 65) {
    if ((h >= 20 && h <= 80)) {
      return ColorCategory.BROWN;
    }
  }
  
  // Chromatic colors - categorize by hue with refined boundaries
  // Red: 340-360° and 0-20° (includes coral/salmon tones)
  if (h >= 340 || h < 20) return ColorCategory.RED;
  
  // Orange: 20-50° (warm oranges)
  if (h >= 20 && h < 50) return ColorCategory.ORANGE;
  
  // Yellow: 50-80° (includes yellow-greens)
  if (h >= 50 && h < 80) return ColorCategory.YELLOW;
  
  // Green: 80-165° (pure greens and blue-greens)
  if (h >= 80 && h < 165) return ColorCategory.GREEN;
  
  // Cyan: 165-195° (true cyans)
  if (h >= 165 && h < 195) return ColorCategory.CYAN;
  
  // Blue: 195-270° (includes deep blues)
  if (h >= 195 && h < 270) return ColorCategory.BLUE;
  
  // Purple: 270-310° (purples and violets)
  if (h >= 270 && h < 310) return ColorCategory.PURPLE;
  
  // Pink/Magenta: 310-340° (hot pinks and magentas)
  if (h >= 310 && h < 340) return ColorCategory.PINK;
  
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
        // Sort browns by hue (orange-browns → yellow-browns), then saturation
        if (Math.abs(hslA.h - hslB.h) > 8) {
          return hslA.h - hslB.h;
        }
        // Then by saturation (more saturated first)
        if (Math.abs(hslA.s - hslB.s) > 5) {
          return hslB.s - hslA.s;
        }
        // Finally by lightness (darker first)
        return hslA.l - hslB.l;
      
      default:
        // Chromatic colors: sort by hue, then saturation, then lightness
        // Group similar hues more tightly (5° threshold)
        if (Math.abs(hslA.h - hslB.h) > 5) {
          return hslA.h - hslB.h;
        }
        
        // Within same hue range, strongly prefer more saturated colors
        // More aggressive saturation sorting for better visual flow
        if (Math.abs(hslA.s - hslB.s) > 10) {
          return hslB.s - hslA.s; // Higher saturation first
        }
        
        // For similar saturation, sort by lightness
        // Darker shades before lighter shades for smooth progression
        if (Math.abs(hslA.l - hslB.l) > 10) {
          return hslA.l - hslB.l;
        }
        
        // Final tiebreaker: prefer slightly more saturated
        return hslB.s - hslA.s;
    }
  });
}
