/**
 * Cache utility module for client-side data caching
 */

// Type definitions for cache items
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache store
const cacheStore: Record<string, CacheItem<any>> = {};

/**
 * Cache data with a specified time-to-live
 * @param key Unique cache key
 * @param data Data to cache
 * @param ttl Time-to-live in milliseconds
 */
export function cacheData<T>(key: string, data: T, ttl = 60000): void {
  const now = Date.now();
  cacheStore[key] = {
    data,
    timestamp: now,
    expiresAt: now + ttl
  };
}

/**
 * Get cached data if available and not expired
 * @param key Cache key
 * @returns Cached data or null if not found or expired
 */
export function getCachedData<T>(key: string): T | null {
  const cached = cacheStore[key];
  if (!cached) {
    return null;
  }

  // Check if cache has expired
  if (Date.now() > cached.expiresAt) {
    delete cacheStore[key];
    return null;
  }

  return cached.data;
}

/**
 * Check if a cache key exists and is valid
 * @param key Cache key
 * @returns True if cache exists and is valid
 */
export function hasCachedData(key: string): boolean {
  const cached = cacheStore[key];
  if (!cached) {
    return false;
  }

  // Check if cache has expired
  if (Date.now() > cached.expiresAt) {
    delete cacheStore[key];
    return false;
  }

  return true;
}

/**
 * Clear a specific cache item
 * @param key Cache key
 */
export function clearCache(key: string): void {
  delete cacheStore[key];
}

/**
 * Clear all cache items
 */
export function clearAllCaches(): void {
  Object.keys(cacheStore).forEach(key => {
    delete cacheStore[key];
  });
}

/**
 * Clear cache items matching a pattern
 * @param pattern String pattern (supports * wildcard)
 */
clearCache.clearCachesByPattern = function(pattern: string): number {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  const keys = Object.keys(cacheStore).filter(key => regex.test(key));
  
  keys.forEach(key => {
    delete cacheStore[key];
  });
  
  return keys.length;
};

/**
 * Generate a cache key from a base string and parameters
 * @param base Base key string
 * @param params Object with parameters to include in the key
 * @returns Cache key string
 */
export function generateCacheKey(base: string, params: Record<string, any> = {}): string {
  const paramString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
    .join('_');
  
  return `${base}:${paramString || 'default'}`;
}

// Attach utility functions to cacheData for convenience
cacheData.get = getCachedData;
cacheData.has = hasCachedData;
cacheData.clear = clearCache;
cacheData.clearAll = clearAllCaches;
cacheData.clearCachesByPattern = clearCache.clearCachesByPattern;
cacheData.generateKey = generateCacheKey; 