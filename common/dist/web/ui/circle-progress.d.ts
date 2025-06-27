import React from 'react';
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
export declare const CircleProgress: React.FC<CircleProgressProps>;
export {};
