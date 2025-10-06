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
 * Sort colors in rainbow/palette order
 * Order: Red → Orange → Yellow → Green → Cyan → Blue → Purple → Pink → Browns → Grays → Black/White
 */
export function sortColorsByPalette<T extends { color?: string }>(colors: T[]): T[] {
  return [...colors].sort((a, b) => {
    const colorA = a.color || '#FFFFFF';
    const colorB = b.color || '#FFFFFF';
    
    const hslA = hexToHsl(colorA);
    const hslB = hexToHsl(colorB);
    
    // Handle grayscale colors (low saturation)
    // Sort by lightness: black → gray → white
    const isGrayA = hslA.s < 15;
    const isGrayB = hslB.s < 15;
    
    if (isGrayA && isGrayB) {
      return hslA.l - hslB.l;
    }
    
    // Grays go to the end
    if (isGrayA) return 1;
    if (isGrayB) return -1;
    
    // For colored items, sort by hue (creates rainbow order)
    // Then by saturation (more saturated first)
    // Then by lightness (darker first)
    if (Math.abs(hslA.h - hslB.h) > 5) {
      return hslA.h - hslB.h;
    }
    
    if (Math.abs(hslA.s - hslB.s) > 5) {
      return hslB.s - hslA.s; // Higher saturation first
    }
    
    return hslA.l - hslB.l; // Darker first
  });
}
