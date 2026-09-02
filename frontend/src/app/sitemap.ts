import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'

  return [
    {
      url: baseUrl,
      lastModified: new Date('2026-08-31'),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/auth`,
      lastModified: new Date('2026-08-31'),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ]
}
