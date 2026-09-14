import type { NextConfig } from "next";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { addAwsImageHosts } = require("../common/lib/utils/aws-image-hosts.cjs") as {
  addAwsImageHosts: (patterns: { protocol?: string; hostname: string }[]) => void;
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'primeshot-uploads-01.s3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'primeshot.ai',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'd3el9qajjnmn76.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Notion image domains for blog
      {
        protocol: 'https',
        hostname: 'www.notion.so',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com',
      },
    ],
  },
  async rewrites() {
    const rules = [] as { source: string; destination: string }[];

    const webapp = process.env.NEXT_PUBLIC_WEBAPP_URL;
    if (webapp) {
      rules.push(
        { source: '/create', destination: `${webapp}/create` },
        { source: '/create/:path*', destination: `${webapp}/create/:path*` },
        // Auth routes - proxy to webapp for authentication flows
        { 
          source: '/auth/:path*', 
          destination: `${webapp}/create/auth/:path*` 
        },
        // Locale-prefixed auth routes
        { 
          source: '/:locale(us|gb|cn|es|fr|pt|de|jp|it|nl)/auth/:path*', 
          destination: `${webapp}/create/auth/:path*`
        },
        // Locale-prefixed forwards for SSR i18n routing - strip locale and pass via header
        // BUT exclude API routes from locale handling to prevent webhook redirects
        { 
          source: '/:locale(us|gb|cn|es|fr|pt|de|jp|it|nl)/create/:path((?!api).*)*', 
          destination: `${webapp}/create/:path*`
        },
        { 
          source: '/:locale(us|gb|cn|es|fr|pt|de|jp|it|nl)/create', 
          destination: `${webapp}/create`
        },
        // Proxy API routes for user account features (subscription, credits, etc.)
        // This allows the marketing website to display user info via AccountDialog
        // Note: webapp has basePath '/create' in production
        { 
          source: '/api/credits/:path*', 
          destination: `${webapp}/create/api/credits/:path*` 
        },
        { 
          source: '/api/subscription/:path*', 
          destination: `${webapp}/create/api/subscription/:path*` 
        },
        { 
          source: '/api/payment/:path*', 
          destination: `${webapp}/create/api/payment/:path*` 
        },
        // Proxy account-related API routes
        { 
          source: '/api/account/:path*', 
          destination: `${webapp}/create/api/account/:path*` 
        },
      );
    }

    const admin = process.env.NEXT_PUBLIC_ADMIN_URL;
    if (admin) {
      rules.push(
        { source: '/admin', destination: `${admin}/admin` },
        { source: '/admin/:path*', destination: `${admin}/admin/:path*` },
      );
    }

    return rules;
  },
  basePath: '',
  assetPrefix: '',
};

addAwsImageHosts(nextConfig.images?.remotePatterns || []);

export default nextConfig;
