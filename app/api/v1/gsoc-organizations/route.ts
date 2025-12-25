import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * GET /api/v1/organizations
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - q: string (search in name/description)
 * - year: number (filter by participation year)
 * - technology: string (filter by technology)
 * - category: string (filter by category)
 * - active: boolean (filter by current active status)
 * - sort: string (name|projects|year) (default: name)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Number(searchParams.get('limit')) || 20)
    const skip = (page - 1) * limit
    const search = searchParams.get('q') || undefined
    const year = searchParams.get('year') || undefined
    const technology = searchParams.get('technology') || undefined
    const category = searchParams.get('category') || undefined
    const active = searchParams.get('active') || undefined
    const sort = searchParams.get('sort') || 'name'

    // Build where clause
    const where: Prisma.organizationsWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = category
    }

    if (technology) {
      where.technologies = { has: technology }
    }

    if (year) {
      where.active_years = { has: parseInt(year) }
    }

    if (active !== undefined) {
      where.is_currently_active = active === 'true'
    }

    // Build order by
    let orderBy: Prisma.organizationsOrderByWithRelationInput = { name: 'asc' }
    if (sort === 'projects') {
      orderBy = { total_projects: 'desc' }
    } else if (sort === 'year') {
      orderBy = { first_year: 'desc' }
    }

    // Fetch organizations with pagination
    const [items, total] = await Promise.all([
      prisma.organizations.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          slug: true,
          name: true,
          category: true,
          description: true,
          image_url: true,
          url: true,
          active_years: true,
          first_year: true,
          last_year: true,
          is_currently_active: true,
          technologies: true,
          topics: true,
          total_projects: true,
          stats: true,
        },
      }),
      prisma.organizations.count({ where }),
    ])

    return NextResponse.json(
      {
        success: true,
        data: {
          organizations: items,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error) {
    console.error('Organizations API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch organizations',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    )
  }
}

