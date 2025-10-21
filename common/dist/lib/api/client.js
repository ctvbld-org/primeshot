/**
 * API URL helper that handles basePath configuration automatically
 * Handles language prefixes for i18n routes to ensure API calls bypass locale routing
 *
 * Usage:
 * - In webapp: handles '/create' basePath in production
 * - In website: typically no basePath
 * - In admin: handles language prefixes and basePath
 */
export function getApiUrl(path) {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // Get base path from environment
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH === '/' ? '' : (process.env.NEXT_PUBLIC_BASE_PATH || '');
    // Handle language prefixes: API routes should never have language prefixes
    if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        // Check if current path has a language prefix pattern (e.g., /en/, /fr/, /de/)
        const langPrefixMatch = currentPath.match(/^\/(\w{2})\//);
        if (langPrefixMatch) {
            // Language prefix detected - construct absolute URL to bypass language routing
            const origin = window.location.origin;
            const targetPath = `${basePath || ''}/${cleanPath}`;
            return `${origin}${targetPath}`;
        }
    }
    return `${basePath}/${cleanPath}`;
}
/**
 * Makes an authenticated API request with proper error handling
 *
 * @param path - API path (e.g., '/api/users')
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws Error if request fails
 */
export async function apiRequest(path, options = {}) {
    const url = getApiUrl(path);
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API request failed: ${response.status} ${error}`);
    }
    return response.json();
}
