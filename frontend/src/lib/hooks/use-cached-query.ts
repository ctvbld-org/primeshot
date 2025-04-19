import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

// Type definitions for the cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
  error: Error | null;
}

// Cache configuration
interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
}

// Default cache configuration
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  ttl: 60000, // 1 minute default cache TTL
}

// In-memory cache store
const cacheStore: Record<string, CacheItem<any>> = {}

/**
 * Hook for cached Supabase queries
 * @param queryFn Function that performs the Supabase query
 * @param deps Dependencies array that should trigger query refetch
 * @param cacheKey Unique key for caching the query result
 * @param cacheConfig Cache configuration options
 */
export function useCachedQuery<T>(
  queryFn: (supabase: SupabaseClient) => Promise<{ data: T | null; error: Error | null }>,
  deps: React.DependencyList = [],
  cacheKey: string,
  cacheConfig: Partial<CacheConfig> = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)

  // Merge default config with user config
  const config = { ...DEFAULT_CACHE_CONFIG, ...cacheConfig }
  
  // Function to check if cache is still valid
  const isCacheValid = (cacheItem: CacheItem<T>): boolean => {
    if (!config.enabled) return false;
    const now = Date.now();
    return now - cacheItem.timestamp < config.ttl;
  }

  // Main fetch function
  const fetchData = useCallback(async (skipCache = false) => {
    const supabase = createClient()
    
    // Check cache first if enabled and not explicitly skipped
    if (config.enabled && !skipCache && cacheStore[cacheKey]) {
      const cachedItem = cacheStore[cacheKey]
      if (isCacheValid(cachedItem)) {
        setData(cachedItem.data)
        setError(cachedItem.error)
        setIsLoading(false)
        return
      }
    }
    
    // Set loading state based on whether we already have data
    if (!data) {
      setIsLoading(true)
    } else {
      setIsValidating(true)
    }
    
    try {
      const { data: fetchedData, error: fetchedError } = await queryFn(supabase)
      
      // Update state with fetched data
      setData(fetchedData)
      setError(fetchedError)
      
      // Update cache
      if (config.enabled && fetchedData) {
        cacheStore[cacheKey] = {
          data: fetchedData,
          error: fetchedError,
          timestamp: Date.now(),
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred')
      setError(error)
      console.error(`Query error for ${cacheKey}:`, error)
    } finally {
      setIsLoading(false)
      setIsValidating(false)
    }
  }, [cacheKey, queryFn, config.enabled, config.ttl, data])

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, cacheKey])

  // Function to manually refetch data
  const refetch = useCallback(() => fetchData(true), [fetchData])

  // Clear specific cache item
  const clearCache = useCallback(() => {
    if (cacheStore[cacheKey]) {
      delete cacheStore[cacheKey]
    }
  }, [cacheKey])

  return {
    data,
    error,
    isLoading,
    isValidating,
    refetch,
    clearCache
  }
}

/**
 * Helper function to clear all cached queries
 */
export function clearAllCaches() {
  Object.keys(cacheStore).forEach(key => {
    delete cacheStore[key]
  })
}

/**
 * Helper function to generate a cache key from query parameters
 */
export function generateCacheKey(table: string, params: Record<string, any> = {}): string {
  return `${table}:${JSON.stringify(params)}`
} 