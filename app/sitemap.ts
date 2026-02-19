import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'
import { loadOrganizationsIndexData } from '@/lib/organizations-page-types'
import { loadTechStackIndexData } from '@/lib/tech-stack-page-types'
import { loadTopicsIndexData } from '@/lib/topics-page-types'
import { getAvailableProjectYears } from '@/lib/projects-page-types'

/**
 * All sitemap data is sourced from static JSON files —
 * no database dependency. When a new year's data is added
 * (via the transform + regenerate scripts), the sitemap
 * picks it up automatically on the next build.
 */

async function getAllOrganizationSlugs(): Promise<string[]> {
  try {
    const data = await loadOrganizationsIndexData()
    if (!data) return []
    return data.organizations.map(org => org.slug)
  } catch (error) {
    console.error('[SITEMAP] Error loading organization slugs:', error)
    return []
  }
}

async function getAllTechStackSlugs(): Promise<string[]> {
  try {
    const data = await loadTechStackIndexData()
    if (!data) return []
    return data.all_techs.map(t => t.slug)
  } catch (error) {
    console.error('[SITEMAP] Error loading tech stack slugs:', error)
    return []
  }
}

async function getAllTopicSlugs(): Promise<string[]> {
  try {
    const topicsData = await loadTopicsIndexData()
    if (!topicsData) return []
    return topicsData.topics.map(topic => topic.slug)
  } catch (error) {
    console.error('[SITEMAP] Error loading topic slugs:', error)
    return []
  }
}

function getYearlySlugs(): string[] {
  const years = getAvailableProjectYears()
  return years.map(y => `google-summer-of-code-${y}`)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL.replace(/\/$/, '').replace(/^http:/, 'https:')

  const [orgSlugs, techSlugs, topicSlugs] = await Promise.all([
    getAllOrganizationSlugs(),
    getAllTechStackSlugs(),
    getAllTopicSlugs(),
  ])

  const yearlySlugs = getYearlySlugs()
  const projectYears = getAvailableProjectYears()

  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/privacy-policy',
    '/terms-and-conditions',
    '/organizations',
    '/tech-stack',
    '/topics',
    '/projects',
    '/yearly',
    '/blog',
  ]

  const routes: MetadataRoute.Sitemap = [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
      priority: route === '' ? 1.0 : route === '/organizations' ? 0.9 : 0.8,
    })),

    ...orgSlugs.map((slug) => ({
      url: `${baseUrl}/organizations/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),

    ...techSlugs.map((slug) => ({
      url: `${baseUrl}/tech-stack/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),

    ...topicSlugs.map((slug) => ({
      url: `${baseUrl}/topics/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),

    ...yearlySlugs.map((slug) => ({
      url: `${baseUrl}/yearly/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.8,
    })),

    ...projectYears.map((year) => ({
      url: `${baseUrl}/projects/${year}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.75,
    })),
  ]

  return routes
}
