import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Number(searchParams.get('limit')) || 20)
    const skip = (page - 1) * limit
    const search = searchParams.get('q') || undefined
    const year = searchParams.get('year') || undefined
    const orgSlug = searchParams.get('org') || undefined

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { project_title: { contains: search, mode: 'insensitive' } },
        { project_abstract_short: { contains: search, mode: 'insensitive' } },
        { org_name: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (year) {
      where.year = parseInt(year)
    }

    if (orgSlug) {
      where.org_slug = orgSlug
    }

    // Fetch projects with pagination
    const [items, total] = await Promise.all([
      prisma.projects.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date_updated: 'desc' },
      }),
      prisma.projects.count({ where }),
    ])

    return NextResponse.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    })
  } catch (error) {
    console.error('Projects fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
