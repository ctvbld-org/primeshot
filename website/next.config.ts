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
    return [
        {
          source: '/create',
          destination: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/create`,
        },
    ];
  },
  basePath: '',
  assetPrefix: '',
};

export default nextConfig;
