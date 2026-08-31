export const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'LiveWave',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000',
  description: 'Real-time uptime monitoring service with HTTP, TCP, ICMP and DNS checks.',
  author: {
    '@type': 'Person',
    name: 'snowdelion',
    sameAs: ['https://github.com/snowdelion', 'https://www.linkedin.com/in/snow-delion-915bba3b9'],
  },
}
