/** @type {import('next').NextConfig} */
const path = require('path')
const isProd = process.env.VERCEL_TARGET_ENV !== 'local'

const nextConfig = {
  basePath: isProd ? '/create' : '',
  assetPrefix: isProd ? '/create' : '',
  webpack: (config, { isServer }) => {
    // Ignore Node.js specific modules in face-api.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      crypto: false,
      path: false,
      stream: false,
    }

    // Path alias so imports like "@/constants/profile-options" work in monorepo
    config.resolve.alias['@/constants'] = path.join(__dirname, 'src/components/constants')

    return config
  },
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
  // compiler: {
  //   removeConsole: {
  //     exclude: ['error'],
  //   },
  // },
  reactStrictMode: false,
}

// Add dynamic hostname from environment variable if available
if (process.env.NEXT_PUBLIC_APP_URL) {
  try {
    const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL);
    // Check if the hostname isn't already in the patterns
    const hostnameExists = nextConfig.images.remotePatterns.some(
      pattern => pattern.hostname === appUrl.hostname
    );
    
    if (!hostnameExists) {
      nextConfig.images.remotePatterns.push({
        protocol: appUrl.protocol.replace(':', ''),
        hostname: appUrl.hostname,
      });
    }
  } catch (error) {
    console.warn('Invalid NEXT_PUBLIC_APP_URL format:', process.env.NEXT_PUBLIC_APP_URL);
  }
}

module.exports = nextConfig
