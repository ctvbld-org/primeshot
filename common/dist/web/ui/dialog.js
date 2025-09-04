"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import styles from "./dialog.module.css";
import { Icon } from "../Icon";
import { useTranslation } from "react-i18next";
function Dialog({ ...props }) {
    return _jsx(DialogPrimitive.Root, { "data-slot": "dialog", ...props });
}
function DialogTrigger({ ...props }) {
    return _jsx(DialogPrimitive.Trigger, { "data-slot": "dialog-trigger", ...props });
}
function DialogPortal({ ...props }) {
    return _jsx(DialogPrimitive.Portal, { "data-slot": "dialog-portal", ...props });
}
function DialogClose({ ...props }) {
    return _jsx(DialogPrimitive.Close, { "data-slot": "dialog-close", ...props });
}
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (_jsx(DialogPrimitive.Overlay, { ref: ref, "data-slot": "dialog-overlay", className: `${styles.overlay} ${className || ''}`, ...props })));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
function DialogContent({ className, children, fullscreen = false, noContainer = false, panelKeepOpen = false, ...props }) {
    return (_jsxs(DialogPortal, { "data-slot": "dialog-portal", children: [_jsx(DialogOverlay, { "data-panel-keepopen": panelKeepOpen ? '' : undefined }), _jsx(DialogPrimitive.Content, { "data-slot": "dialog-content", className: `${styles.dialog} ${(fullscreen || noContainer) ? styles.fullscreen : ''} ${noContainer ? styles.noContainer : ''} ${className || ''}`, ...props, children: _jsx("div", { className: styles.content, "data-panel-keepopen": panelKeepOpen ? '' : undefined, children: children }) })] }));
}
function DialogHeader({ className, children, ...props }) {
    const { t } = useTranslation('common');
    return (_jsxs("div", { "data-slot": "dialog-header", className: `${styles.header} ${className || ''}`, ...props, children: [children, _jsxs(DialogPrimitive.Close, { className: styles.closeButton, children: [_jsx(Icon, { variant: "cross", size: 24, className: styles.closeIcon }), _jsx("span", { className: "sr-only", children: t('buttons.close') })] })] }));
}
function DialogBody({ className, children, ...props }) {
    return (_jsx("div", { className: `${styles.body} ${className || ''}`, ...props, children: children }));
}
function DialogFooter({ className, ...props }) {
    return (_jsx("div", { "data-slot": "dialog-footer", className: `${styles.footer} ${className || ''}`, ...props }));
}
function DialogTitle({ className, ...props }) {
    return (_jsx(DialogPrimitive.Title, { "data-slot": "dialog-title", className: `${styles.title} ${className || ''}`, ...props }));
}
function DialogDescription({ className, ...props }) {
    return (_jsx(DialogPrimitive.Description, { "data-slot": "dialog-description", className: `${styles.description} ${className || ''}`, ...props }));
}
export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogBody, DialogTrigger, };
