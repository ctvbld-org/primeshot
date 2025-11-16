import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/app/',
        '/_next/',
        '/404',
        '/500',
      ],
    },
    sitemap: 'https://primeshot.ai/sitemap.xml',
  };
}

