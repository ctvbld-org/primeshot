import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../../lib/utils';
/**
 * Pure-CSS circular progress indicator driven by CSS variables.
 * Updates are handled simply by changing the `--value` custom property.
 */
export const CircleProgress = ({ value, size = 64, thickness = 2, className, }) => {
    // Clamp between 0-100 to avoid invalid gradient stops
    const percent = Math.max(0, Math.min(100, value));
    return (_jsx("span", { className: cn('circle-progress', className), style: {
            '--value': percent,
            '--size': `${size}px`,
            '--thickness': `${thickness}px`,
        } }));
};
