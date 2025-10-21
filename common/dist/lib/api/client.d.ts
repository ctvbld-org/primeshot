/**
 * API URL helper that handles basePath configuration automatically
 * Handles language prefixes for i18n routes to ensure API calls bypass locale routing
 *
 * Usage:
 * - In webapp: handles '/create' basePath in production
 * - In website: typically no basePath
 * - In admin: handles language prefixes and basePath
 */
export declare function getApiUrl(path: string): string;
/**
 * Makes an authenticated API request with proper error handling
 *
 * @param path - API path (e.g., '/api/users')
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws Error if request fails
 */
export declare function apiRequest<T>(path: string, options?: RequestInit): Promise<T>;
