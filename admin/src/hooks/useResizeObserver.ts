'use client';

import { useEffect, useState } from 'react';

export function useResizeObserver() {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
}

// Hook specifically for responsive chart container dimensions
export function useChartDimensions(baseHeight: number = 400) {
  const { width } = useResizeObserver();
  
  // Adjust chart height based on screen width for better mobile experience
  const getResponsiveHeight = () => {
    if (width < 640) return baseHeight * 0.75; // Mobile: reduce height
    if (width < 1024) return baseHeight * 0.85; // Tablet: slightly reduce
    return baseHeight; // Desktop: full height
  };

  return {
    width: '100%',
    height: getResponsiveHeight(),
    containerHeight: getResponsiveHeight(),
  };
} 