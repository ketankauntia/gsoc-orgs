import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/tech-stack/[slug]/analytics
 * 
 * Returns analytics data for a specific tech stack:
 * - Organization growth over years
 * - Project count over years
 * - Difficulty distribution
 * - Year-wise participation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Convert slug back to tech name (handle variations)
    const techName = slug.replace(/-/g, ' ')

    // Find tech variations
    const orgs = await prisma.organizations.findMany({
      select: { technologies: true },
      take: 1000,
    })

    const allTechs = Array.from(
      new Set<string>(orgs.flatMap((org) => org.technologies))
    )
    
    const variations = allTechs.filter((tech) =>
      tech.toLowerCase().includes(techName.toLowerCase()) ||
      techName.toLowerCase().includes(tech.toLowerCase())
    )

    const techVariations = variations.length > 0 ? variations : [techName]

    // Get all organizations using this technology
    const organizations = await prisma.organizations.findMany({
      where: {
        technologies: {
          hasSome: techVariations,
        },
      },
      select: {
        id_: true,
        name: true,
        slug: true,
        active_years: true,
        years: true,
        total_projects: true,
        is_currently_active: true,
        technologies: true,
      },
    })

    if (organizations.length === 0) {
      return NextResponse.json(
        { error: 'Technology not found or no organizations use it' },
        { status: 404 }
      )
    }

    // Get the most common variation of the tech name
    const allTechsFromOrgs = organizations.flatMap((org) => 
      org.technologies?.filter((t: string) => 
        techVariations.some(v => t.toLowerCase().includes(v.toLowerCase()))
      ) || []
    )
    const mostCommon = allTechsFromOrgs.length > 0
      ? allTechsFromOrgs.sort(
          (a: string, b: string) =>
            allTechsFromOrgs.filter((t: string) => t === b).length -
            allTechsFromOrgs.filter((t: string) => t === a).length
        )[0]
      : techName

    // Calculate organization growth over years (2020-2025)
    const years = [2020, 2021, 2022, 2023, 2024, 2025]
    const orgGrowthByYear = years.map(year => {
      const count = organizations.filter(org => 
        org.active_years.includes(year)
      ).length
      return { year, count }
    })

    // Calculate project count over years
    const projectsByYear = years.map(year => {
      let totalProjects = 0
      organizations.forEach(org => {
        if (org.years && org.active_years.includes(year)) {
          const yearKey = `year_${year}`
          const yearData = (org.years as Record<string, { num_projects?: number }>)[yearKey]
          if (yearData) {
            totalProjects += yearData.num_projects || 0
          }
        }
      })
      return { year, count: totalProjects }
    })

    // Calculate difficulty distribution
    const difficultyCount: Record<string, number> = {
      'Beginner': 0,
      'Intermediate': 0,
      'Advanced': 0,
    }

    organizations.forEach(org => {
      if (org.years) {
        const yearsData = org.years as Record<string, { projects?: Array<{ difficulty?: string }> }>
        Object.values(yearsData).forEach(yearData => {
          if (yearData && yearData.projects) {
            yearData.projects.forEach(project => {
              const diff = project.difficulty
              if (diff && diff in difficultyCount) {
                difficultyCount[diff as keyof typeof difficultyCount]++
              }
            })
          }
        })
      }
    })

    const difficultyDistribution = [
      { level: 'Beginner Friendly', count: difficultyCount['Beginner'] || 0 },
      { level: 'Intermediate', count: difficultyCount['Intermediate'] || 0 },
      { level: 'Advanced', count: difficultyCount['Advanced'] || 0 },
    ]

    // Calculate total stats
    const totalProjects = organizations.reduce((sum, org) => sum + org.total_projects, 0)
    const activeOrgs = organizations.filter(org => org.is_currently_active).length
    const allActiveYears = Array.from(new Set(
      organizations.flatMap(org => org.active_years)
    )).sort((a, b) => b - a)

    return NextResponse.json({
      technology: {
        name: mostCommon,
        slug,
        usage_count: organizations.length,
      },
      stats: {
        totalOrganizations: organizations.length,
        activeOrganizations: activeOrgs,
        totalProjects,
        activeYears: allActiveYears,
      },
      analytics: {
        orgGrowthByYear,
        projectsByYear,
        difficultyDistribution,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Tech stack analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tech stack analytics' },
      { status: 500 }
    )
  }
}

