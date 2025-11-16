/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'dweb.link',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    unoptimized: true, // Allow unoptimized images for IPFS and external sources
  },
  webpack: (config, { isServer }) => {
    // External modules that shouldn't be bundled
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Fix for MetaMask SDK trying to import React Native modules in web context
    // Provide a shim for React Native async-storage used by MetaMask SDK in browser builds
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': require.resolve('./src/shims/async-storage.ts'),
    };
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': require.resolve('./src/shims/async-storage.ts'),
    };
    
    return config;
  },
};

module.exports = nextConfig;
