import type { Metadata } from 'next'
import { Barlow_Condensed, Geist, Geist_Mono, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { QueryProvider } from './providers/QueryProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-barlow',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jet-brains',
})

export const metadata: Metadata = {
  title: 'LiveWave',
  description: 'Uptime monitor for your services',
  keywords: ['uptime', 'monitoring', 'LiveWave'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${barlowCondensed.variable} ${inter.variable} ${jetBrainsMono.variable}`}
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
