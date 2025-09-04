'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import styles from "./top-banner.module.css";
const bannerVariants = cva(styles.banner, {
    variants: {
        variant: {
            default: styles.default,
            success: styles.success,
            destructive: styles.destructive,
        },
    },
    defaultVariants: {
        variant: "default",
    },
});
const TopBanner = React.forwardRef(({ className, variant, title, description, onClose, showClose = true, ...props }, ref) => {
    return (_jsxs("div", { ref: ref, role: "alert", className: cn(bannerVariants({ variant }), className), ...props, children: [_jsxs("div", { className: styles.content, children: [title && _jsx("div", { className: styles.title, children: title }), description && _jsx("div", { className: styles.description, children: description })] }), showClose && (_jsx("button", { onClick: onClose, className: styles.closeButton, "aria-label": "Close banner", children: _jsx(X, { className: "h-4 w-4" }) }))] }));
});
TopBanner.displayName = "TopBanner";
export { TopBanner };
