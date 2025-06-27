import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
export function Loader({ size = 'md', text, className }) {
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };
    return (_jsxs("div", { className: cn("flex flex-col items-center justify-center gap-3", className), children: [_jsx("div", { className: "relative", children: _jsx("div", { className: cn("animate-spin rounded-full border-4 border-solid border-primary border-t-transparent", sizeClasses[size]) }) }), text && (_jsx("p", { className: "text-sm text-muted-foreground animate-pulse", children: text }))] }));
}
