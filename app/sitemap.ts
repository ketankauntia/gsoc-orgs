import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'
import prisma from '@/lib/prisma'
import { loadTopicsIndexData } from '@/lib/topics-page-types'
import { getAvailableProjectYears } from '@/lib/projects-page-types'

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
 * Get all topic slugs from static JSON data
 */
async function getAllTopicSlugs(): Promise<string[]> {
  try {
    const topicsData = await loadTopicsIndexData()
    if (!topicsData) {
      // Fallback to hardcoded list if JSON not available
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
    return topicsData.topics.map(topic => topic.slug)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[SITEMAP] Error loading topics:', error)
    }
    return []
  }
}

/**
 * Get all project IDs for project detail pages
 * Fetches from database to get all unique project IDs
 */
async function getAllProjectIds(): Promise<Array<{ project_id: string; org_slug: string }>> {
  try {
    const projects = await prisma.projects.findMany({
      select: {
        project_id: true,
        org_slug: true,
      },
      distinct: ['project_id'],
    })
    return projects
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[SITEMAP] Error fetching project IDs:', error)
    }
    return []
  }
}

/**
 * Sitemap Generation
 * 
 * Currently generated at build time (no revalidate configured).
 * If you add `export const revalidate = X` to this file, it becomes ISR instead of build-only.
 * 
 * Base URL validation:
 * - Ensures no trailing slash
 * - Uses https protocol
 * - Falls back to production URL if env not set
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Ensure baseUrl has no trailing slash and uses https
  const baseUrl = SITE_URL.replace(/\/$/, '').replace(/^http:/, 'https:')

  // Fetch dynamic routes in parallel
  const [orgSlugs, techSlugs, topicSlugs, projectIds] = await Promise.all([
    getAllOrganizationSlugs(),
    getAllTechStackSlugs(),
    getAllTopicSlugs(),
    getAllProjectIds(),
  ])

  // Static routes explicitly listed (excluding dynamic children like /organizations/[slug])
  // These are top-level pages without dynamic parameters
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

  // Trending routes - one per entity (default monthly range)
  const trendingRoutes = [
    '/trending/organizations',
    '/trending/projects',
    '/trending/tech-stack',
    '/trending/topics',
  ]

  // Generate year-based routes (2016 to current year - 1, excluding future years)
  // Only include years that have actually completed GSoC
  // Using new /yearly/google-summer-of-code-YYYY format for SEO
  const currentYear = new Date().getFullYear()
  const lastCompletedYear = currentYear - 1 // Exclude current year and future years
  const yearRoutes = []
  for (let year = 2016; year <= lastCompletedYear; year++) {
    yearRoutes.push(`/yearly/google-summer-of-code-${year}`)
  }

  // Generate project year routes (2016 to current year)
  const projectYearRoutes = getAvailableProjectYears().map(year => `/projects/${year}`)

  // Combine all routes with appropriate priorities
  const routes: MetadataRoute.Sitemap = [
    // Homepage - highest priority
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
      priority: route === '' ? 1.0 : route === '/organizations' ? 0.9 : 0.8,
    })),
    
    // Trending routes - medium priority (updated frequently)
    ...trendingRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.75,
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
    
    // Project year pages - medium priority
    ...projectYearRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.75,
    })),
    
    // Project detail pages - lower priority (deep pages, many URLs)
    // Deprioritized to preserve crawl budget for higher-value pages
    ...projectIds.map(({ project_id, org_slug }) => ({
      url: `${baseUrl}/organizations/${org_slug}/projects/${project_id}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]

  return routes
}

