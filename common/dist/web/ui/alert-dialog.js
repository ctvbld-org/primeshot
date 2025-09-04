"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "../../lib/utils";
import styles from "./alert-dialog.module.css";
function AlertDialog({ ...props }) {
    return _jsx(AlertDialogPrimitive.Root, { "data-slot": "alert-dialog", ...props });
}
function AlertDialogTrigger({ ...props }) {
    return (_jsx(AlertDialogPrimitive.Trigger, { "data-slot": "alert-dialog-trigger", ...props }));
}
function AlertDialogPortal({ ...props }) {
    return (_jsx(AlertDialogPrimitive.Portal, { "data-slot": "alert-dialog-portal", ...props }));
}
const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (_jsx(AlertDialogPrimitive.Overlay, { ref: ref, "data-slot": "alert-dialog-overlay", className: cn(styles.overlay, className), ...props })));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
function AlertDialogContent({ className, children, ...props }) {
    return (_jsxs(AlertDialogPortal, { children: [_jsx(AlertDialogOverlay, {}), _jsx(AlertDialogPrimitive.Content, { "data-slot": "alert-dialog-content", className: styles.content, ...props, children: _jsx("div", { className: cn(styles.contentInner, className), children: children }) })] }));
}
function AlertDialogHeader({ className, ...props }) {
    return (_jsx("div", { "data-slot": "alert-dialog-header", className: cn(styles.header, className), ...props }));
}
function AlertDialogFooter({ className, ...props }) {
    return (_jsx("div", { "data-slot": "alert-dialog-footer", className: cn(styles.footer, className), ...props }));
}
function AlertDialogTitle({ className, ...props }) {
    return (_jsx(AlertDialogPrimitive.Title, { "data-slot": "alert-dialog-title", className: cn(styles.title, className), ...props }));
}
function AlertDialogDescription({ className, ...props }) {
    return (_jsx(AlertDialogPrimitive.Description, { "data-slot": "alert-dialog-description", className: cn(styles.description, className), ...props }));
}
const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (_jsx(AlertDialogPrimitive.Action, { ref: ref, className: cn(styles.button, styles.buttonPrimary, className), ...props })));
AlertDialogAction.displayName = "AlertDialogAction";
const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (_jsx(AlertDialogPrimitive.Cancel, { ref: ref, className: cn(styles.button, styles.buttonOutline, className), ...props })));
AlertDialogCancel.displayName = "AlertDialogCancel";
function PaymentRecoveryDialog({ open, onOpenChange, orderId, onResume, onCancel }) {
    return (_jsx(AlertDialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Resume Payment" }), _jsx(AlertDialogDescription, { children: "We detected an interrupted payment for your order. Would you like to resume where you left off?" })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { onClick: onCancel, children: "Cancel" }), _jsx(AlertDialogAction, { onClick: onResume, children: "Resume Payment" })] })] }) }));
}
export { AlertDialog, AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, PaymentRecoveryDialog };
