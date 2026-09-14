const CDN_BASE = (process.env.NEXT_PUBLIC_AWS_DISTRIBUTION || '').replace(/\/$/, '');

export function getCdnBase(): string {
  return CDN_BASE;
}

/** CSS custom properties for backgrounds that cannot read env vars. */
export function getCdnCssVars(): string {
  if (!CDN_BASE) return '';
  return `:root {
    --cdn-noise-overlay: url("${CDN_BASE}/website-images/noise-overlay100.png");
    --cdn-noise: url("${CDN_BASE}/website-images/noise.png");
    --cdn-example-generated-1: url("${CDN_BASE}/website-images/example-generated-1-w320.webp");
    --cdn-example-generated-2: url("${CDN_BASE}/website-images/example-generated-2-w320.webp");
    --cdn-landing-page-3: url("${CDN_BASE}/website-images/landing-page-3-w1280.webp");
  }`;
}

/**
 * Get CDN URL for webapp public assets (all under app-images/)
 * Falls back to local path if CDN is not configured
 */
export function getAppCdnUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return CDN_BASE ? `${CDN_BASE}/app-images/${cleanPath}` : `/${cleanPath}`;
}

/**
 * Get CDN URL for website assets (under website-images/)
 * Falls back to local path if CDN is not configured
 */
export function getWebsiteCdnUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return CDN_BASE ? `${CDN_BASE}/website-images/${cleanPath}` : `/${cleanPath}`;
}
