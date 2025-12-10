import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(500, Number(searchParams.get('limit')) || 200)
    const search = searchParams.get('q') || undefined

    // Build where clause
    const where: any = {}

    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    // Get all unique technologies from organizations
    const organizations = await prisma.organizations.findMany({
      where: where.name ? where : undefined,
      select: {
        technologies: true,
      },
    })

    // Extract and deduplicate technologies
    const techMap = new Map<string, { name: string; count: number }>()
    
    organizations.forEach((org) => {
      org.technologies.forEach((tech) => {
        const existing = techMap.get(tech.toLowerCase())
        if (existing) {
          existing.count++
        } else {
          techMap.set(tech.toLowerCase(), { name: tech, count: 1 })
        }
      })
    })

    // Convert to array and sort by count
    const items = Array.from(techMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((tech) => ({
        name: tech.name,
        slug: tech.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        usage_count: tech.count,
      }))

    return NextResponse.json({
      total: items.length,
      items,
    })
  } catch (error) {
    console.error('Tech stack fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tech stacks' },
      { status: 500 }
    )
  }
}
