import React from 'react';
import { cn } from '@/lib/utils';

interface CircleProgressProps {
  /**
   * Current progress percentage (0-100)
   */
  value: number;
  /**
   * Diameter of the circle in pixels (default 64)
   */
  size?: number;
  /**
   * Thickness of the progress ring in pixels (default 6)
   */
  thickness?: number;
  /**
   * Additional class names to merge
   */
  className?: string;
}

/**
 * Pure-CSS circular progress indicator driven by CSS variables.
 * Updates are handled simply by changing the `--value` custom property.
 */
export const CircleProgress: React.FC<CircleProgressProps> = ({
  value,
  size = 64,
  thickness = 2,
  className,
}) => {
  // Clamp between 0-100 to avoid invalid gradient stops
  const percent = Math.max(0, Math.min(100, value));

  return (
    <span
      className={cn('circle-progress', className)}
      style={
        {
          '--value': percent,
          '--size': `${size}px`,
          '--thickness': `${thickness}px`,
        } as React.CSSProperties
      }
    />
  );
}; 