import type { NextConfig } from "next";
require('dotenv').config({ path: './.env.local' });

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // ... (keep existing runtimeCaching configuration)
  ]
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer, webpack }) => {
    // Handle node: protocol imports
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^node:/,
        (resource: { request: string }) => {
          resource.request = resource.request.replace(/^node:/, '');
        }
      )
    );

    // Polyfill or exclude Node.js core modules for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        worker_threads: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser'),
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify/browser'),
        zlib: require.resolve('browserify-zlib'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        http2: require.resolve('http2-wrapper'),
        querystring: require.resolve('querystring-es3'),
        vm: require.resolve('vm-browserify'),
        events: require.resolve('events/'),
        util: require.resolve('util'),
        assert: require.resolve('assert/')
      };
    }

    // Configure aliases for core modules
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:http': require.resolve('stream-http'),
      'node:https': require.resolve('https-browserify'),
      'node:http2': require.resolve('http2-wrapper'),
      'node:stream': require.resolve('stream-browserify'),
      'node:util': require.resolve('util'),
      'util': require.resolve('util')
    };

    return config;
  },
  serverExternalPackages: ['firebase-admin', '@google-cloud/storage'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['react-icons', 'framer-motion', 'recharts']
  }
};

export default withPWA(nextConfig);
