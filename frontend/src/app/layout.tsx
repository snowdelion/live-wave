import type { Metadata, Viewport } from 'next'
import './globals.css'
import './animations.css'

import { fontVariables, JSON_LD, METADATA, VIEWPORT } from '@/shared/config'

import { QueryProvider } from './providers/QueryProvider'

export const viewport: Viewport = VIEWPORT
export const metadata: Metadata = METADATA

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="custom-scrollbar">
      <body className={fontVariables}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
