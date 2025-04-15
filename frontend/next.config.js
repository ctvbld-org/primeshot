/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ignore Node.js specific modules in face-api.js
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
    domains: ['primeshot-uploads-01.s3.us-east-1.amazonaws.com'],
  },
}

module.exports = nextConfig
