/** @type {import('next').NextConfig} */
const path = require('path')
const isProd = process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV !== 'local'

const nextConfig = {
  basePath: isProd ? '/create' : '',
  assetPrefix: isProd ? '/create' : '',
  transpilePackages: ['@primeshot/common'],
  experimental: { 
    externalDir: true,
    serverActions: {
      bodySizeLimit: '50mb'
    }
  },
  // Set output file tracing root to silence monorepo warning
  outputFileTracingRoot: path.join(__dirname, '../'),
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

    // In local dev, prefer source from common package to enable HMR
    if (!isProd) {
      config.resolve.alias['@primeshot/common/web'] = path.resolve(__dirname, '../common/web')
      config.resolve.alias['@primeshot/common/locales'] = path.resolve(__dirname, '../common/locales')
      config.resolve.alias['@primeshot/common/hooks'] = path.resolve(__dirname, '../common/hooks')
      config.resolve.alias['@primeshot/common/lib'] = path.resolve(__dirname, '../common/lib')
      config.resolve.alias['@primeshot/common'] = path.resolve(__dirname, '../common/index.ts')
    }

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
    localPatterns: [
      {
        pathname: '/api/app-images',
        search: '',
      },
    ],
    qualities: [75, 80, 85, 90, 100],
  },
  // compiler: {
  //   removeConsole: {
  //     exclude: ['error'],
  //   },
  // },
  reactStrictMode: false,
  // Add proper MIME type for WASM files to fix MediaPipe loading
  headers: async () => {
    return [
      {
        source: '/:path*.wasm',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/wasm',
          },
        ],
      },
    ]
  },
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
