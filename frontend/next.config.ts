import type { NextConfig } from 'next'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: !isProd ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${!isProd ? " 'unsafe-eval'" : ''} https://telegram.org`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https: wss:",
              'frame-src https://oauth.telegram.org',
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          ...(isProd
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
            : []),
        ],
      },
    ]
  },

  compiler: {
    removeConsole: isProd ? { exclude: ['error', 'warn'] } : false,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.telegram.org',
      },
      {
        protocol: 'https',
        hostname: 't.me',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  reactStrictMode: true,
  poweredByHeader: false,
}

export default nextConfig
