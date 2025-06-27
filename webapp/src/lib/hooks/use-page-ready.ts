import { useState, useEffect } from 'react';

interface UsePageReadyOptions {
  rootElement?: HTMLElement | null;
  onComplete?: () => void;
  waitForImages?: boolean;
}

interface PageReadyState {
  isMounted: boolean;
  imagesLoaded: boolean;
  isReady: boolean;
}

export function usePageReady({ 
  rootElement, 
  onComplete,
  waitForImages = true 
}: UsePageReadyOptions = {}): PageReadyState {
  const [state, setState] = useState<PageReadyState>({
    isMounted: false,
    imagesLoaded: !waitForImages, // If not waiting for images, consider them loaded
    isReady: false
  });

  // Handle mounting
  useEffect(() => {
    setState(prev => ({ ...prev, isMounted: true }));
  }, []);

  // Handle image loading
  useEffect(() => {
    if (!waitForImages) return;
    if (!state.isMounted) return; // Wait for mount before checking images

    const root = rootElement || document;
    const images = root.querySelectorAll('img');
    let loadedCount = 0;
    const totalImages = images.length;

    // If no images, mark as loaded immediately
    if (totalImages === 0) {
      setState(prev => ({ ...prev, imagesLoaded: true }));
      return;
    }

    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setState(prev => ({ ...prev, imagesLoaded: true }));
      }
    };

    // Check each image
    images.forEach(img => {
      if (img.complete) {
        handleImageLoad();
      } else {
        img.addEventListener('load', handleImageLoad);
        img.addEventListener('error', handleImageLoad); // Count errors as loaded to prevent hanging
      }
    });

    // Cleanup listeners
    return () => {
      images.forEach(img => {
        img.removeEventListener('load', handleImageLoad);
        img.removeEventListener('error', handleImageLoad);
      });
    };
  }, [state.isMounted, rootElement, waitForImages]);

  // Update ready state and call onComplete when both conditions are met
  useEffect(() => {
    const isReady = state.isMounted && state.imagesLoaded;
    setState(prev => ({ ...prev, isReady }));
    
    if (isReady) {
      onComplete?.();
    }
  }, [state.isMounted, state.imagesLoaded, onComplete]);

  return state;
} 