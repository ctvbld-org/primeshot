import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
function Skeleton({ className, ...props }) {
    return (_jsx("div", { "data-slot": "skeleton", className: cn("bg-[#202A32] animate-pulse rounded-md", className), ...props }));
}
export { Skeleton };
