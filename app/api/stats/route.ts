import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Get lightweight counts for quick stats
    const [
      totalOrganizations,
      activeOrganizations,
      totalProjects,
      totalTechnologies,
    ] = await Promise.all([
      prisma.organizations.count(),
      prisma.organizations.count({
        where: { is_currently_active: true },
      }),
      prisma.projects.count(),
      // Get unique technologies count
      prisma.organizations
        .findMany({
          select: { technologies: true },
        })
        .then((orgs) => {
          const uniqueTechs = new Set(orgs.flatMap((org) => org.technologies))
          return uniqueTechs.size
        }),
    ])

    // Get year range
    const years = await prisma.organizations.findMany({
      select: {
        first_year: true,
        last_year: true,
      },
    })

    const allYears = years.flatMap((y) => [y.first_year, y.last_year])
    const minYear = Math.min(...allYears)
    const maxYear = Math.max(...allYears)

    return NextResponse.json({
      organizations: {
        total: totalOrganizations,
        active: activeOrganizations,
        inactive: totalOrganizations - activeOrganizations,
      },
      projects: {
        total: totalProjects,
      },
      technologies: {
        total: totalTechnologies,
      },
      years: {
        first: minYear,
        last: maxYear,
        range: maxYear - minYear + 1,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Stats fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
