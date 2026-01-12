import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { CacheHeaders } from '@/lib/cache'

/**
 * GET /api/v1/stats
 * 
 * Returns overall platform statistics
 * 
 * Caching: Medium TTL (7 days) - aggregated stats update with new year data
 */
export async function GET() {
  try {
    const [
      totalOrganizations,
      activeOrganizations,
      totalProjects,
      organizations,
    ] = await Promise.all([
      prisma.organizations.count(),
      prisma.organizations.count({
        where: { is_currently_active: true },
      }),
      prisma.projects.count(),
      prisma.organizations.findMany({
        select: {
          technologies: true,
          topics: true,
          category: true,
          active_years: true,
          first_year: true,
          last_year: true,
        },
      }),
    ])

    // Calculate unique technologies
    const uniqueTechs = new Set(
      organizations.flatMap((org) => org.technologies)
    )

    // Calculate unique topics
    const uniqueTopics = new Set(
      organizations.flatMap((org) => org.topics)
    )

    // Calculate unique categories
    const uniqueCategories = new Set(
      organizations.map((org) => org.category)
    )

    // Calculate year range
    const allYears = organizations.flatMap((org) => org.active_years)
    const uniqueYears = new Set(allYears)
    const minYear = Math.min(...allYears)
    const maxYear = Math.max(...allYears)

    // Top categories
    const categoryCounts = new Map<string, number>()
    organizations.forEach((org) => {
      categoryCounts.set(
        org.category,
        (categoryCounts.get(org.category) || 0) + 1
      )
    })
    const topCategories = Array.from(categoryCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Top technologies
    const techCounts = new Map<string, number>()
    organizations.forEach((org) => {
      org.technologies.forEach((tech) => {
        techCounts.set(tech, (techCounts.get(tech) || 0) + 1)
      })
    })
    const topTechnologies = Array.from(techCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    return NextResponse.json(
      {
        success: true,
        data: {
          overview: {
            total_organizations: totalOrganizations,
            active_organizations: activeOrganizations,
            inactive_organizations: totalOrganizations - activeOrganizations,
            total_projects: totalProjects,
            total_technologies: uniqueTechs.size,
            total_topics: uniqueTopics.size,
            total_categories: uniqueCategories.size,
          },
          years: {
            first: minYear,
            last: maxYear,
            total: uniqueYears.size,
            range: maxYear - minYear + 1,
          },
          top_categories: topCategories,
          top_technologies: topTechnologies,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          cached: true,
          cache_ttl: '7 days',
        },
      },
      {
        headers: {
          'Cache-Control': CacheHeaders.MEDIUM,
        },
      }
    )
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch statistics',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    )
  }
}

