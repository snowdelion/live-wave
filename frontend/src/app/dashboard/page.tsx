import type { Metadata } from 'next'

import { DashboardPage } from '@/pages-flat/dashboard'

export default DashboardPage

export const metadata: Metadata = {
  title: 'Dashboard',
  alternates: { canonical: '/dashboard' },
}
