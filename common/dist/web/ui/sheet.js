"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import styles from "./sheet.module.css";
const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;
const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (_jsx(SheetPrimitive.Overlay, { className: `${styles.overlay} ${className || ''}`, ...props, ref: ref })));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
const SheetContent = React.forwardRef(({ side = "right", className, children, modal = true, ...props }, ref) => {
    const getContentClasses = () => {
        const baseClasses = styles.content;
        const sideClasses = {
            top: styles.contentTop,
            bottom: styles.contentBottom,
            left: styles.contentLeft,
            right: styles.contentRight,
        };
        return `${baseClasses} ${sideClasses[side]} ${className || ''}`;
    };
    return (_jsxs(SheetPortal, { children: [modal && _jsx(SheetOverlay, {}), _jsxs(SheetPrimitive.Content, { ref: ref, className: getContentClasses(), ...props, children: [_jsx("div", { children: children }), _jsxs(SheetPrimitive.Close, { className: styles.closeButton, children: [_jsx(X, { className: styles.closeIcon }), _jsx("span", { className: styles.srOnly, children: "Close" })] })] })] }));
});
SheetContent.displayName = SheetPrimitive.Content.displayName;
const SheetHeader = ({ className, ...props }) => (_jsx("div", { className: `${styles.header} ${className || ''}`, ...props }));
SheetHeader.displayName = "SheetHeader";
const SheetFooter = ({ className, ...props }) => (_jsx("div", { className: `${styles.footer} ${className || ''}`, ...props }));
SheetFooter.displayName = "SheetFooter";
const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx(SheetPrimitive.Title, { ref: ref, className: `${styles.title} ${className || ''}`, ...props })));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx(SheetPrimitive.Description, { ref: ref, className: `${styles.description} ${className || ''}`, ...props })));
SheetDescription.displayName = SheetPrimitive.Description.displayName;
export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, };
