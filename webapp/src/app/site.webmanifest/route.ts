import { NextResponse } from 'next/server';
import { getWebsiteCdnUrl } from '@primeshot/common/lib/utils/cdn';

export async function GET() {
  const manifest = {
    name: "Primeshot",
    short_name: "Primeshot",
    icons: [
      {
        src: getWebsiteCdnUrl('favicon-96x96.png'),
        sizes: "96x96",
        type: "image/png",
        purpose: "any"
      },
      {
        src: getWebsiteCdnUrl('apple-touch-icon.png'),
        sizes: "180x180",
        type: "image/png",
        purpose: "any"
      },
      {
        src: getWebsiteCdnUrl('web-app-manifest-192x192.png'),
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: getWebsiteCdnUrl('web-app-manifest-512x512.png'),
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    theme_color: "#0c1013",
    background_color: "#0c1013",
    display: "standalone"
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
}

