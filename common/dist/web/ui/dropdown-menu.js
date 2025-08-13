"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "../../lib/utils";
import styles from "./dropdown-menu.module.css";
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
const DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => (_jsxs(DropdownMenuPrimitive.SubTrigger, { ref: ref, className: cn(styles.dropdownMenuSubTrigger, inset && styles.inset, className), ...props, children: [children, _jsx(ChevronRight, { className: "ml-auto h-4 w-4" })] })));
DropdownMenuSubTrigger.displayName =
    DropdownMenuPrimitive.SubTrigger.displayName;
const DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => (_jsx(DropdownMenuPrimitive.SubContent, { ref: ref, className: cn(styles.dropdownMenuSubContent, className), ...props })));
DropdownMenuSubContent.displayName =
    DropdownMenuPrimitive.SubContent.displayName;
const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (_jsx(DropdownMenuPrimitive.Portal, { children: _jsx(DropdownMenuPrimitive.Content, { ref: ref, sideOffset: sideOffset, className: cn(styles.dropdownMenuContent, className), ...props }) })));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
const DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => (_jsx(DropdownMenuPrimitive.Item, { ref: ref, className: cn(styles.dropdownMenuItem, inset && styles.inset, className), ...props })));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => (_jsxs(DropdownMenuPrimitive.CheckboxItem, { ref: ref, className: cn(styles.dropdownMenuCheckboxItem, className), checked: checked, ...props, children: [_jsx("span", { className: styles.dropdownMenuIndicator, children: _jsx(DropdownMenuPrimitive.ItemIndicator, { children: _jsx(Check, { className: "h-4 w-4" }) }) }), children] })));
DropdownMenuCheckboxItem.displayName =
    DropdownMenuPrimitive.CheckboxItem.displayName;
const DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => (_jsxs(DropdownMenuPrimitive.RadioItem, { ref: ref, className: cn(styles.dropdownMenuRadioItem, className), ...props, children: [_jsx("span", { className: styles.dropdownMenuIndicator, children: _jsx(DropdownMenuPrimitive.ItemIndicator, { children: _jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }), children] })));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => (_jsx(DropdownMenuPrimitive.Label, { ref: ref, className: cn(styles.dropdownMenuLabel, inset && styles.inset, className), ...props })));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (_jsx(DropdownMenuPrimitive.Separator, { ref: ref, className: cn(styles.dropdownMenuSeparator, className), ...props })));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
const DropdownMenuShortcut = ({ className, ...props }) => {
    return (_jsx("span", { className: cn(styles.dropdownMenuShortcut, className), ...props }));
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup, };
