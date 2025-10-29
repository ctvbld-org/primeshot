/**
 * Utility functions for localStorage with expiry support
 */

interface StoredValue<T> {
  value: T;
  expiry: number;
}

/**
 * Set a value in localStorage with an expiry time
 * @param key - The localStorage key
 * @param value - The value to store
 * @param expiryDays - Number of days until the value expires
 */
export function setLocalStorageWithExpiry<T>(
  key: string,
  value: T,
  expiryDays: number
): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const expiryTime = now + expiryDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  
  const item: StoredValue<T> = {
    value,
    expiry: expiryTime,
  };

  try {
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Get a value from localStorage if it exists and hasn't expired
 * @param key - The localStorage key
 * @returns The stored value or null if not found/expired
 */
export function getLocalStorageWithExpiry<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const itemStr = localStorage.getItem(key);
    
    if (!itemStr) {
      return null;
    }

    const item: StoredValue<T> = JSON.parse(itemStr);
    const now = Date.now();

    // Check if expired
    if (now > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return item.value;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
}

/**
 * Remove a value from localStorage
 * @param key - The localStorage key
 */
export function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

