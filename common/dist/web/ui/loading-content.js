import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { usePageReady } from '@/lib/hooks/use-page-ready';
import { cn } from '@/lib/utils';
export function LoadingContent({ children, className, fallback, onLoadComplete, waitForImages = true, ...props }) {
    const contentRef = useRef(null);
    const { isReady } = usePageReady({
        rootElement: contentRef.current,
        onComplete: onLoadComplete,
        waitForImages
    });
    // Default fallback if none provided
    const defaultFallback = (_jsx("div", { className: "min-h-[inherit] w-full flex items-center justify-center", children: _jsxs("div", { className: "animate-pulse flex flex-col items-center space-y-4", children: [_jsx("div", { className: "w-12 h-12 bg-muted rounded-full" }), _jsx("div", { className: "h-4 w-32 bg-muted rounded" })] }) }));
    return (_jsx("div", { ref: contentRef, className: cn('min-h-[100px]', className), ...props, children: isReady ? children : (fallback || defaultFallback) }));
}
// Skeleton components for custom loading states
export function SkeletonImage({ className, ...props }) {
    return (_jsx("div", { className: cn("animate-pulse bg-muted rounded-md", className), ...props }));
}
export function SkeletonText({ className, ...props }) {
    return (_jsx("div", { className: cn("h-4 animate-pulse bg-muted rounded", className), ...props }));
}
export function SkeletonAvatar({ className, ...props }) {
    return (_jsx("div", { className: cn("w-12 h-12 animate-pulse bg-muted rounded-full", className), ...props }));
}
