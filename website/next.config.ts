import type { NextConfig } from "next";

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
    ],
  },
  async rewrites() {
    const rules = [] as { source: string; destination: string }[];

    const webapp = process.env.NEXT_PUBLIC_WEBAPP_URL;
    if (webapp) {
      rules.push(
        { source: '/create', destination: `${webapp}/create` },
        { source: '/create/:path*', destination: `${webapp}/create/:path*` },
        // Locale-prefixed forwards for SSR i18n routing
        { source: '/:locale(en|fr|es|it|pt|de|nl|cn|jp)/create', destination: `${webapp}/:locale/create` },
        { source: '/:locale(en|fr|es|it|pt|de|nl|cn|jp)/create/:path*', destination: `${webapp}/:locale/create/:path*` },
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

export default nextConfig;
