const CDN_BASE = process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || '';

/**
 * Get CDN URL for website public assets (all under website-images/)
 * Falls back to local path if CDN is not configured
 */
export function getCdnUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return CDN_BASE ? `${CDN_BASE}/website-images/${cleanPath}` : `/${cleanPath}`;
}

/**
 * Get CDN URL for app-images assets (shared across app and website)
 * Falls back to local path if CDN is not configured
 */
export function getAppCdnUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return CDN_BASE ? `${CDN_BASE}/app-images/${cleanPath}` : `/${cleanPath}`;
}
