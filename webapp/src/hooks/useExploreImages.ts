import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '@primeshot/common/lib/api/client';

interface ExploreImage {
  id: string;
  image: string;
  createdAt: string;
}

interface ExploreImagesResponse {
  images: ExploreImage[];
  total: number;
}

interface UseExploreImagesReturn {
  images: ExploreImage[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Simple in-memory cache with TTL
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: ExploreImagesResponse; timestamp: number }>();

/**
 * Custom hook to check which preview images exist in explore_images
 */
export function useExploreImages(previewImages: string[]): UseExploreImagesReturn {
  const [images, setImages] = useState<ExploreImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    if (!previewImages || previewImages.length === 0) {
      setIsLoading(false);
      return;
    }

    // Create cache key from preview images
    const cacheKey = previewImages.sort().join(',');
    
    // Check cache first
    const cached = cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      setImages(cached.data.images);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        getApiUrl('/api/explore/by-style'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ previewImages }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ExploreImagesResponse = await response.json();

      // Cache the response
      cache.set(cacheKey, { data, timestamp: now });

      setImages(data.images || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch explore images';
      setError(errorMessage);
      console.error('Error fetching explore images:', err);
    } finally {
      setIsLoading(false);
    }
  }, [previewImages]);

  // Fetch images on mount and when previewImages changes
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return {
    images,
    isLoading,
    error,
    refetch: fetchImages,
  };
}

/**
 * Clear the cache for specific images or all
 */
export function clearExploreImagesCache(previewImages?: string[]) {
  if (previewImages) {
    const cacheKey = previewImages.sort().join(',');
    cache.delete(cacheKey);
  } else {
    cache.clear();
  }
}

