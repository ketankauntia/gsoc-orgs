import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL

  // Static routes
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/privacy-policy',
    '/terms-and-conditions',
    '/organizations',
    '/tech-stack',
    '/topics',
  ]

  // Generate year-based routes (2005 to current year + 1)
  const currentYear = new Date().getFullYear()
  const yearRoutes = []
  for (let year = 2005; year <= currentYear + 1; year++) {
    yearRoutes.push(`/gsoc-${year}-organizations`)
  }

  // Combine all routes
  const routes = [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
      priority: route === '' ? 1.0 : route === '/organizations' ? 0.9 : 0.8,
    })),
    ...yearRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
  ]

  return routes
}

