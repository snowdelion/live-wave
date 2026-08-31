import type { Metadata } from 'next'

import { AuthPage } from '@/pages-flat/auth/ui/AuthPage'

export default AuthPage

export const metadata: Metadata = {
  title: 'Welcome Back',
  alternates: { canonical: '/auth' },
}
