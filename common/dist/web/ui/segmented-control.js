import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import styles from './segmented-control.module.css';
import { cn } from '../../lib/utils';
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
    const width = `${100 / count}%`;
    const transform = `translateX(${idx * 100}%)`;
    const itemRefs = React.useRef([]);
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
    return (_jsxs("div", { role: "radiogroup", "aria-orientation": "horizontal", "aria-label": ariaLabel, className: cn(styles.segmented, fullWidth && styles.segmentedFull, size === 'sm' ? styles['size-sm'] : styles['size-md'], className), children: [options.length > 0 && _jsx("div", { className: styles.segmentThumb, style: { width, transform } }), options.map((opt, i) => {
                var _a;
                const isActive = String(value) === String(opt.value);
                return (_jsx("button", { type: "button", role: "radio", "aria-checked": isActive, "aria-disabled": opt.disabled || undefined, tabIndex: i === focusIndex ? 0 : -1, ref: el => { itemRefs.current[i] = el; }, className: cn(styles.segment, isActive && styles.segmentActive, opt.disabled && styles.segmentDisabled), disabled: opt.disabled, onClick: () => !opt.disabled && onChange(opt.value), onKeyDown: (e) => handleKeyDown(e, i), children: (_a = opt.content) !== null && _a !== void 0 ? _a : String(opt.value) }, String(opt.value)));
            })] }));
}
