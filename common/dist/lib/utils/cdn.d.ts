export declare function getCdnBase(): string;
/** CSS custom properties for backgrounds that cannot read env vars. */
export declare function getCdnCssVars(): string;
/**
 * Get CDN URL for webapp public assets (all under app-images/)
 * Falls back to local path if CDN is not configured
 */
export declare function getAppCdnUrl(path: string): string;
/**
 * Get CDN URL for website assets (under website-images/)
 * Falls back to local path if CDN is not configured
 */
export declare function getWebsiteCdnUrl(path: string): string;
