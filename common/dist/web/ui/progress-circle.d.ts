interface ProgressCircleProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    trackColor?: string;
    color?: string;
    className?: string;
    ariaLabel?: string;
    /**
     * Visual direction of progress rendering.
     * - 'fill' (default): 0% renders empty, 100% renders full.
     * - 'drain': 0% renders full, 100% renders empty.
     */
    direction?: 'fill' | 'drain';
    /**
     * Sweep direction. When true, progress advances clockwise from 12 o'clock.
     * Defaults to false to preserve existing counter-clockwise behavior.
     */
    clockwise?: boolean;
}
export declare function ProgressCircle({ percentage, size, strokeWidth, trackColor, color, className, ariaLabel, direction, clockwise }: ProgressCircleProps): import("react/jsx-runtime").JSX.Element;
export default ProgressCircle;
