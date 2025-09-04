import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../lib/utils";
function Card({ className, ...props }) {
    return (_jsx("div", { "data-slot": "card", className: cn("rounded-lg border bg-card text-card-foreground shadow-sm", className), ...props }));
}
function CardHeader({ className, ...props }) {
    return (_jsx("div", { "data-slot": "card-header", className: cn("flex flex-col space-y-1.5 p-6", className), ...props }));
}
function CardTitle({ className, ...props }) {
    return (_jsx("div", { "data-slot": "card-title", className: cn("text-2xl font-semibold leading-none tracking-tight", className), ...props }));
}
function CardDescription({ className, ...props }) {
    return (_jsx("div", { "data-slot": "card-description", className: cn("text-sm text-muted-foreground", className), ...props }));
}
function CardAction({ className, ...props }) {
    return (_jsx("div", { "data-slot": "card-action", className: cn("flex items-center space-x-2", className), ...props }));
}
function CardContent({ className, ...props }) {
    return (_jsx("div", { "data-slot": "card-content", className: cn("p-6 pt-0", className), ...props }));
}
function CardFooter({ className, ...props }) {
    return (_jsx("div", { "data-slot": "card-footer", className: cn("flex items-center p-6 pt-0", className), ...props }));
}
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent, };
