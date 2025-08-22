'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseLazyLoadingOptions {
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

interface UseLazyLoadingReturn {
  ref: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
  isIntersecting: boolean;
}

/**
 * Hook for lazy loading using Intersection Observer
 * Useful for loading images or content when elements come into viewport
 */
export function useLazyLoading(options: UseLazyLoadingOptions = {}): UseLazyLoadingReturn {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = false
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    const isCurrentlyIntersecting = entry.isIntersecting;
    
    setIsIntersecting(isCurrentlyIntersecting);
    
    if (isCurrentlyIntersecting) {
      setIsVisible(true);
      
      if (triggerOnce && observerRef.current && ref.current) {
        observerRef.current.unobserve(ref.current);
      }
    } else if (!triggerOnce) {
      setIsVisible(false);
    }
  }, [triggerOnce]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Create observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold
    });

    // Start observing
    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
      }
    };
  }, [handleIntersection, rootMargin, threshold]);

  return {
    ref,
    isVisible,
    isIntersecting
  };
}

/**
 * Hook specifically for infinite scrolling
 * Triggers when the element comes into view to load more content
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  options: { rootMargin?: string; threshold?: number } = {}
) {
  const { rootMargin = '100px', threshold = 0.1 } = options;
  const { ref, isIntersecting } = useLazyLoading({ rootMargin, threshold });

  useEffect(() => {
    if (isIntersecting) {
      onLoadMore();
    }
  }, [isIntersecting, onLoadMore]);

  return { ref };
}

/**
 * Hook for lazy loading images
 * Returns whether the image should be loaded and provides intersection status
 */
export function useLazyImage(options: UseLazyLoadingOptions = {}) {
  const defaultOptions = {
    rootMargin: '200px', // Load images 200px before they come into view
    threshold: 0,
    triggerOnce: true, // Once loaded, keep loaded
    ...options
  };

  return useLazyLoading(defaultOptions);
}
