import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import styles from './input.module.css';
function Input({ className, type, ...props }) {
    return (_jsx("input", { type: type, "data-slot": "input", className: cn(styles.input, className), ...props }));
}
export { Input };
