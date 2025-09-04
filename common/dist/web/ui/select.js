"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Icon } from "../Icon";
import { cn } from "../../lib/utils";
import styles from "./select.module.css";
function Select({ ...props }) {
    return _jsx(SelectPrimitive.Root, { "data-slot": "select", ...props });
}
function SelectGroup({ ...props }) {
    return _jsx(SelectPrimitive.Group, { "data-slot": "select-group", ...props });
}
function SelectValue({ ...props }) {
    return _jsx(SelectPrimitive.Value, { "data-slot": "select-value", ...props });
}
function SelectTrigger({ className, size = "default", children, ...props }) {
    return (_jsxs(SelectPrimitive.Trigger, { "data-slot": "select-trigger", "data-size": size, className: cn(styles.trigger, className), ...props, children: [children, _jsx(SelectPrimitive.Icon, { asChild: true, children: _jsx(Icon, { variant: 'chevronDown', size: 16, className: styles.chevronDownIcon }) })] }));
}
function SelectContent({ className, children, position = "popper", ...props }) {
    return (_jsx(SelectPrimitive.Portal, { children: _jsxs(SelectPrimitive.Content, { "data-slot": "select-content", className: cn(styles.content, className), position: position, ...props, children: [_jsx(SelectScrollUpButton, {}), _jsx(SelectPrimitive.Viewport, { className: cn(position === "popper" ? styles.viewportPopper : styles.viewport), children: children }), _jsx(SelectScrollDownButton, {})] }) }));
}
function SelectLabel({ className, ...props }) {
    return (_jsx(SelectPrimitive.Label, { "data-slot": "select-label", className: cn(styles.label, className), ...props }));
}
function SelectItem({ className, children, ...props }) {
    return (_jsxs(SelectPrimitive.Item, { "data-slot": "select-item", className: cn(styles.item, className), ...props, children: [_jsx("span", { className: styles.itemIndicator, children: _jsx(SelectPrimitive.ItemIndicator, { children: _jsx(CheckIcon, { className: "size-4" }) }) }), _jsx(SelectPrimitive.ItemText, { children: children })] }));
}
function SelectSeparator({ className, ...props }) {
    return (_jsx(SelectPrimitive.Separator, { "data-slot": "select-separator", className: cn(styles.separator, className), ...props }));
}
function SelectScrollUpButton({ className, ...props }) {
    return (_jsx(SelectPrimitive.ScrollUpButton, { "data-slot": "select-scroll-up-button", className: cn(styles.scrollButton, className), ...props, children: _jsx(ChevronUpIcon, { className: "size-4" }) }));
}
function SelectScrollDownButton({ className, ...props }) {
    return (_jsx(SelectPrimitive.ScrollDownButton, { "data-slot": "select-scroll-down-button", className: cn(styles.scrollButton, className), ...props, children: _jsx(ChevronDownIcon, { className: "size-4" }) }));
}
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, };
