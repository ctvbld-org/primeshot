import { type ClassValue } from "clsx";
/**
 * Merge class names conditionally.
 * Same implementation as webapp/src/lib/utils.ts for reuse in common package.
 */
export declare function cn(...inputs: ClassValue[]): string;
/**
 * Convert a byte size into a human-readable string (Bytes, KB, MB, or GB).
 */
export declare function formatFileSize(bytes: number): string;
