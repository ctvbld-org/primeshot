import { useState, useEffect } from 'react';

interface UseImagesLoadedOptions {
  rootElement?: HTMLElement | null;
  onComplete?: () => void;
}

export function useImagesLoaded({ rootElement, onComplete }: UseImagesLoadedOptions = {}) {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    // Get the root element to search within, default to document
    const root = rootElement || document;
    const images = root.querySelectorAll('img');
    let loadedCount = 0;
    const totalImages = images.length;

    // If no images, mark as loaded immediately
    if (totalImages === 0) {
      setImagesLoaded(true);
      onComplete?.();
      return;
    }

    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setImagesLoaded(true);
        onComplete?.();
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
  }, [rootElement, onComplete]);

  return imagesLoaded;
} 