/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Handle Node.js specific modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      crypto: false,
      path: false,
      stream: false,
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
        hostname: 'd3el9qajjnmn76.cloudfront.net',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
}

module.exports = nextConfig