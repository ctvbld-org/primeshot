import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
/**
 * Merge class names conditionally.
 * Same implementation as webapp/src/lib/utils.ts for reuse in common package.
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
/**
 * Convert a byte size into a human-readable string (Bytes, KB, MB, or GB).
 */
export function formatFileSize(bytes) {
    if (bytes === 0)
        return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
