import type { Metadata, Viewport } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'

export const METADATA: Metadata = {
  title: {
    default: 'LiveWave · Real-time uptime monitoring',
    template: 'LiveWave · %s',
  },
  description:
    'LiveWave is a real-time uptime monitoring service. Track HTTP, TCP, ICMP, and DNS services with instant Telegram alerts.',
  keywords: [
    'uptime monitor',
    'uptime monitoring',
    'website monitoring',
    'server monitoring',
    'uptime checker',
    'HTTP monitoring',
    'TCP monitoring',
    'ICMP monitoring',
    'DNS monitoring',
    'ping monitor',
    'real-time monitoring',
    'telegram alerts',
    'status page',
    'downtime alerts',
    'LiveWave',
  ],
  authors: [{ name: 'snowdelion', url: 'https://github.com/snowdelion' }],
  creator: 'snowdelion',
  metadataBase: new URL(APP_URL),

  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'LiveWave',
    images: [
      {
        url: '/dashboard-preview.jpg',
        width: 1200,
        height: 630,
        alt: 'LiveWave Dashboard Preview',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    images: ['/dashboard-preview.jpg'],
  },
}

export const VIEWPORT: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}
