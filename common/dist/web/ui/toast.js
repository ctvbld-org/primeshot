import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import styles from "./toast.module.css";
const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (_jsx(ToastPrimitives.Viewport, { ref: ref, className: cn(styles.viewport, className), ...props })));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
const toastVariants = cva(styles.toast, {
    variants: {
        variant: {
            default: styles.default,
            success: styles.default,
            destructive: styles.destructive,
        },
    },
    defaultVariants: {
        variant: "default",
    },
});
const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
    return (_jsx(ToastPrimitives.Root, { ref: ref, className: cn(toastVariants({ variant }), className), ...props }));
});
Toast.displayName = ToastPrimitives.Root.displayName;
const ToastAction = React.forwardRef(({ className, ...props }, ref) => (_jsx(ToastPrimitives.Action, { ref: ref, className: cn(styles.action, className), ...props })));
ToastAction.displayName = ToastPrimitives.Action.displayName;
const ToastClose = React.forwardRef(({ className, ...props }, ref) => (_jsx(ToastPrimitives.Close, { ref: ref, className: cn(styles.close, className), "toast-close": "", ...props, children: _jsx(X, { className: "h-4 w-4" }) })));
ToastClose.displayName = ToastPrimitives.Close.displayName;
const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx(ToastPrimitives.Title, { ref: ref, className: cn(styles.title, className), ...props })));
ToastTitle.displayName = ToastPrimitives.Title.displayName;
const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx(ToastPrimitives.Description, { ref: ref, className: cn(styles.description, className), ...props })));
ToastDescription.displayName = ToastPrimitives.Description.displayName;
export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction, };
