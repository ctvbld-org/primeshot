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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'primeshot-uploads-01.s3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'studio.primeshot.ai',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // compiler: {
  //   removeConsole: {
  //     exclude: ['error'],
  //   },
  // },
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
