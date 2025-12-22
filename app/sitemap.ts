import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'
import prisma from '@/lib/prisma'

/**
 * Fetch all organization slugs directly from database
 */
async function getAllOrganizationSlugs(): Promise<string[]> {
  try {
    const organizations = await prisma.organizations.findMany({
      select: { slug: true },
      orderBy: { name: 'asc' },
    })
    return organizations.map(org => org.slug)
  } catch (error) {
    console.error('Error fetching organization slugs for sitemap:', error)
    return [] // Return empty array on error to prevent sitemap generation failure
  }
}

/**
 * Fetch all tech stack slugs directly from database
 */
async function getAllTechStackSlugs(): Promise<string[]> {
  try {
    // Get all organizations with their technologies
    const organizations = await prisma.organizations.findMany({
      select: { technologies: true },
    })
    
    // Extract and deduplicate technologies
    const techMap = new Set<string>()
    organizations.forEach((org) => {
      org.technologies.forEach((tech) => {
        const slug = tech.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        techMap.add(slug)
      })
    })
    
    return Array.from(techMap)
  } catch (error) {
    console.error('Error fetching tech stack slugs for sitemap:', error)
    return []
  }
}

/**
 * Get all topic slugs (hardcoded list from topics page)
 */
function getAllTopicSlugs(): string[] {
  return [
    'web-development',
    'machine-learning',
    'systems-programming',
    'data-science',
    'security-privacy',
    'cloud-infrastructure',
    'mobile-development',
    'devtools',
    'graphics-multimedia',
    'databases',
    'programming-languages',
    'documentation',
  ]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL

  // Fetch dynamic routes in parallel
  const [orgSlugs, techSlugs, topicSlugs] = await Promise.all([
    getAllOrganizationSlugs(),
    getAllTechStackSlugs(),
    Promise.resolve(getAllTopicSlugs()),
  ])

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

  // Generate year-based routes (2005 to current year - 1, excluding future years)
  // Only include years that have actually completed GSoC
  const currentYear = new Date().getFullYear()
  const lastCompletedYear = currentYear - 1 // Exclude current year and future years
  const yearRoutes = []
  for (let year = 2005; year <= lastCompletedYear; year++) {
    yearRoutes.push(`/gsoc-${year}-organizations`)
  }

  // Combine all routes with appropriate priorities
  const routes: MetadataRoute.Sitemap = [
    // Homepage - highest priority
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
      priority: route === '' ? 1.0 : route === '/organizations' ? 0.9 : 0.8,
    })),
    
    // Organization detail pages - high priority (money pages for SEO)
    ...orgSlugs.map((slug) => ({
      url: `${baseUrl}/organizations/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    
    // Tech stack detail pages - high priority
    ...techSlugs.map((slug) => ({
      url: `${baseUrl}/tech-stack/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
    
    // Topic detail pages - high priority
    ...topicSlugs.map((slug) => ({
      url: `${baseUrl}/topics/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
    
    // Year pages - medium priority
    ...yearRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.8,
    })),
  ]

  return routes
}

