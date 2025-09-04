import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function cleanPercentage(percentage) {
    const n = Number(percentage);
    if (!Number.isFinite(n) || n < 0)
        return 0;
    if (n > 100)
        return 100;
    return n;
}
export function ProgressCircle({ percentage, size = 36, strokeWidth = 2, trackColor = 'transparent', color = '#2ADED8', className }) {
    const pct = cleanPercentage(percentage);
    const center = size / 2;
    const radius = center - strokeWidth / 2;
    const circ = 2 * Math.PI * radius;
    const strokePct = ((100 - pct) * circ) / 100;
    return (_jsxs("svg", { width: size, height: size, className: className, style: { transform: 'rotateZ(270deg) rotateX(180deg)' }, children: [_jsx("circle", { r: radius, cx: center, cy: center, stroke: trackColor, strokeWidth: strokeWidth, strokeDasharray: circ, strokeDashoffset: 0, fill: "transparent" }), _jsx("circle", { r: radius, cx: center, cy: center, stroke: color, strokeWidth: strokeWidth, strokeDasharray: circ, strokeDashoffset: strokePct, fill: "transparent", strokeLinecap: "round" })] }));
}
export default ProgressCircle;
