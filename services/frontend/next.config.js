/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable TypeScript strict mode
  typescript: {
    ignoreBuildErrors: false,
  },

  // Enable React strict mode
  reactStrictMode: true,

  // Enable SWC minification
  swcMinify: true,

  // Configure image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['localhost', '127.0.0.1'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Environment variables available in the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    NEXT_PUBLIC_WS_URL: process.env.VITE_WS_URL || 'ws://localhost:3000',
    NEXT_PUBLIC_APP_NAME: process.env.VITE_APP_NAME || 'OrçamentosOnline',
    NEXT_PUBLIC_APP_VERSION: process.env.VITE_APP_VERSION || '1.0.0',
    NEXT_PUBLIC_MAX_FILE_SIZE: process.env.VITE_MAX_FILE_SIZE || '10485760',
    NEXT_PUBLIC_SUPPORTED_FILE_TYPES: process.env.VITE_SUPPORTED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf',
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add bundle analyzer in development
    if (process.env.ANALYZE) {
      const withBundleAnalyzer = require('@next/bundle-analyzer')({
        enabled: true,
      });
      return withBundleAnalyzer(config);
    }

    return config;
  },

  // Experimental features
  experimental: {
    // Enable app directory (App Router)
    appDir: true,
    // Enable server components
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  // Output configuration for deployment
  output: 'standalone',

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: true,
      },
    ];
  },

  // Rewrites for API proxy in development
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://api:3000/api/:path*',
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;