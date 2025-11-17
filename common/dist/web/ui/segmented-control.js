import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import styles from './segmented-control.module.css';
import { cn } from '../../lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
export function SegmentedControl({ options, value, onChange, className, fullWidth = true, size = 'md', ariaLabel, }) {
    var _a;
    const count = Math.max(1, options.length);
    const selectedIndex = options.findIndex(o => String(o.value) === String(value));
    const getFirstEnabled = () => options.findIndex(o => !o.disabled);
    const getLastEnabled = () => {
        var _a;
        for (let i = options.length - 1; i >= 0; i--) {
            if (!((_a = options[i]) === null || _a === void 0 ? void 0 : _a.disabled))
                return i;
        }
        return -1;
    };
    const focusIndex = selectedIndex >= 0 && !((_a = options[selectedIndex]) === null || _a === void 0 ? void 0 : _a.disabled)
        ? selectedIndex
        : Math.max(0, getFirstEnabled());
    const idx = Math.max(0, selectedIndex >= 0 ? selectedIndex : 0);
    const fallbackWidth = `${100 / count}%`;
    const fallbackTransform = `translateX(${idx * 100}%)`;
    const itemRefs = React.useRef([]);
    const containerRef = React.useRef(null);
    const [thumbStyle, setThumbStyle] = React.useState(null);
    // Measure the selected item's width and position so the thumb matches it
    const measure = React.useCallback(() => {
        if (!containerRef.current)
            return;
        const i = Math.max(0, options.findIndex(o => String(o.value) === String(value)));
        const el = itemRefs.current[i];
        if (!el) {
            setThumbStyle(null);
            return;
        }
        const w = el.offsetWidth;
        const x = el.offsetLeft - 3; /* account for .segmentThumb { left: 3px } */
        // Only update when values actually change to avoid jank
        setThumbStyle(prev => (prev && prev.width === w && prev.x === x) ? prev : { width: w, x });
    }, [options, value]);
    React.useLayoutEffect(() => {
        measure();
        if (!containerRef.current)
            return;
        const ro = new ResizeObserver(() => measure());
        ro.observe(containerRef.current);
        itemRefs.current.forEach(el => el && ro.observe(el));
        const onResize = () => measure();
        window.addEventListener('resize', onResize);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', onResize);
        };
    }, [measure]);
    const getNextEnabled = (start, direction) => {
        var _a;
        let i = start;
        for (let step = 0; step < options.length; step++) {
            i = (i + direction + options.length) % options.length;
            if (!((_a = options[i]) === null || _a === void 0 ? void 0 : _a.disabled))
                return i;
        }
        return start;
    };
    const handleKeyDown = React.useCallback((e, currentIndex) => {
        var _a;
        const move = (dir) => {
            var _a;
            if (!options.length)
                return currentIndex;
            let j = currentIndex;
            for (let k = 0; k < options.length; k++) {
                j = (j + dir + options.length) % options.length;
                if (!((_a = options[j]) === null || _a === void 0 ? void 0 : _a.disabled))
                    return j;
            }
            return currentIndex;
        };
        let next = currentIndex;
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                next = move(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                next = move(1);
                break;
            case 'Home':
                e.preventDefault();
                next = options.findIndex(o => !o.disabled);
                break;
            case 'End':
                e.preventDefault();
                next = [...options].reverse().findIndex(o => !o.disabled);
                next = next === -1 ? currentIndex : options.length - 1 - next;
                break;
            default:
                return;
        }
        if (next !== -1 && !((_a = options[next]) === null || _a === void 0 ? void 0 : _a.disabled))
            onChange(options[next].value);
    }, [options, onChange]);
    return (_jsx(TooltipProvider, { delayDuration: 300, children: _jsxs("div", { role: "radiogroup", "aria-orientation": "horizontal", "aria-label": ariaLabel, ref: containerRef, className: cn(styles.segmented, fullWidth && styles.segmentedFull, size === 'sm' ? styles['size-sm'] : styles['size-md'], className), children: [options.length > 0 && (_jsx("div", { className: styles.segmentThumb, style: thumbStyle
                        ? { width: thumbStyle.width, transform: `translateX(${thumbStyle.x}px)` }
                        : { width: fallbackWidth, transform: fallbackTransform } })), options.map((opt, i) => {
                    var _a;
                    const isActive = String(value) === String(opt.value);
                    const button = (_jsx("button", { type: "button", role: "radio", "aria-checked": isActive, "aria-disabled": opt.disabled || undefined, title: opt.disabled && opt.tooltip ? opt.tooltip : undefined, tabIndex: i === focusIndex ? 0 : -1, ref: el => { itemRefs.current[i] = el; }, className: cn(styles.segment, isActive && styles.segmentActive, opt.disabled && styles.segmentDisabled), disabled: opt.disabled, onClick: () => !opt.disabled && onChange(opt.value), onKeyDown: (e) => handleKeyDown(e, i), children: (_a = opt.content) !== null && _a !== void 0 ? _a : String(opt.value) }, String(opt.value)));
                    // Only wrap with tooltip if disabled AND has tooltip text
                    if (opt.disabled && opt.tooltip) {
                        return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: button }), _jsx(TooltipContent, { children: _jsx("p", { children: opt.tooltip }) })] }, String(opt.value)));
                    }
                    return button;
                })] }) }));
}
