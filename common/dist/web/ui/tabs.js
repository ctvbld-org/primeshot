"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";
function Tabs({ className, orientation = "horizontal", ...props }) {
    return (_jsx(TabsPrimitive.Root, { "data-slot": "tabs", "data-orientation": orientation, className: cn("flex flex-1", orientation === "vertical" ? "flex-row" : "flex-col gap-2", className), ...props }));
}
function TabsList({ className, ...props }) {
    return (_jsx(TabsPrimitive.List, { "data-slot": "tabs-list", className: cn("flex", "[&[data-orientation=horizontal]]:flex-row [&[data-orientation=horizontal]]:items-center [&[data-orientation=horizontal]]:justify-center [&[data-orientation=horizontal]]:rounded-lg [&[data-orientation=horizontal]]:p-[3px]", "[&[data-orientation=vertical]]:flex-col", className), ...props }));
}
function TabsTrigger({ className, ...props }) {
    return (_jsx(TabsPrimitive.Trigger, { "data-slot": "tabs-trigger", className: cn("inline-flex items-center justify-center whitespace-nowrap transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50", className), ...props }));
}
function TabsContent({ className, ...props }) {
    return (_jsx(TabsPrimitive.Content, { "data-slot": "tabs-content", className: cn("outline-none", className), ...props }));
}
export { Tabs, TabsList, TabsTrigger, TabsContent };
