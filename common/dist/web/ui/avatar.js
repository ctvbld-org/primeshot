"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useMemo } from 'react';
import { cn } from "../../lib/utils";
import style from "./avatar.module.css";
export function Avatar({ src, fallback, alt, className, ...props }) {
    const [hasError, setHasError] = React.useState(false);
    // Transform social login profile picture URLs to ensure best quality and compatibility
    const transformedSrc = useMemo(() => {
        if (!src)
            return null;
        // Handle Google profile pictures
        if (src.includes('googleusercontent.com')) {
            // Convert to a more reliable format that works better with direct access
            const baseUrl = src.split('=')[0];
            return `${baseUrl}=s96-cc-rg`;
        }
        // Handle LinkedIn profile pictures
        if (src.includes('licdn.com')) {
            // Remove size restrictions if present and request full size
            return src.replace(/\?.*$/, '');
        }
        return src;
    }, [src]);
    return (_jsx("div", { className: cn(style.base, className), ...props, children: transformedSrc && !hasError ? (_jsx("img", { src: transformedSrc, alt: alt, className: style.image, onError: (e) => {
                console.error('Image failed to load:', e.currentTarget.src);
                setHasError(true);
            }, referrerPolicy: "no-referrer" })) : (_jsx("div", { className: style.fallback, children: fallback })) }));
}
