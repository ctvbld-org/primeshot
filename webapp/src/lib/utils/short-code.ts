/**
 * Utility for generating short, URL-safe codes for share links
 * Uses base62 encoding (0-9, a-z, A-Z) for readability and URL safety
 */

/**
 * Generate a short, URL-safe code
 * @param length - Length of the code to generate (default: 6)
 * @returns Random base62 string
 */
export function generateShortCode(length: number = 6): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  
  // Use crypto.getRandomValues for secure random generation
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    code += chars[array[i] % chars.length];
  }
  
  return code;
}

/**
 * Validate that a code contains only allowed characters
 * @param code - Code to validate
 * @returns true if code is valid
 */
export function isValidShortCode(code: string): boolean {
  return /^[0-9a-zA-Z]+$/.test(code);
}

