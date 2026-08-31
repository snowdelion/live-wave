import type { Metadata } from 'next'

import { LandingPage } from '@/pages-flat/landing'

export default LandingPage

export const metadata: Metadata = {
  title: 'Real-time uptime monitoring',
  alternates: { canonical: '/' },
}
