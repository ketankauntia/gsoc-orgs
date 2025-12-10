import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    // Convert slug back to tech name (handle variations)
    const techName = slug.replace(/-/g, ' ')

    // Find all organizations using this technology
    const organizations = await prisma.organizations.findMany({
      where: {
        technologies: {
          hasSome: await findTechVariations(techName),
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image_url: true,
        logo_r2_url: true,
        category: true,
        total_projects: true,
        is_currently_active: true,
        technologies: true,
      },
      orderBy: {
        total_projects: 'desc',
      },
    })

    if (organizations.length === 0) {
      return NextResponse.json(
        { error: 'Technology not found or no organizations use it' },
        { status: 404 }
      )
    }

    // Get the most common variation of the tech name
    const allTechs = organizations.flatMap((org) => org.technologies || [])
    const techVariations = allTechs.filter((t: string) =>
      t.toLowerCase().includes(techName.toLowerCase())
    )
    const mostCommon =
      techVariations.sort(
        (a: string, b: string) =>
          techVariations.filter((t: string) => t === b).length -
          techVariations.filter((t: string) => t === a).length
      )[0] || techName

    return NextResponse.json({
      technology: {
        name: mostCommon,
        slug,
        usage_count: organizations.length,
      },
      organizations,
    })
  } catch (error) {
    console.error('Tech stack detail fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tech stack details' },
      { status: 500 }
    )
  }
}

// Helper function to find common variations of tech name
async function findTechVariations(techName: string): Promise<string[]> {
  // Get all unique technologies to find exact matches
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

  return variations.length > 0 ? variations : [techName]
}
