import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Number(searchParams.get('limit')) || 20)
    const skip = (page - 1) * limit
    const search = searchParams.get('q') || undefined
    const category = searchParams.get('category') || undefined
    const tech = searchParams.get('tech') || undefined
    const year = searchParams.get('year') || undefined
    const difficulty = searchParams.get('difficulty') || undefined
    const topic = searchParams.get('topic') || undefined

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = category
    }

    if (tech) {
      where.technologies = { has: tech }
    }

    if (year) {
      where.active_years = { has: parseInt(year) }
    }

    if (difficulty) {
      // Map difficulty to DB field if needed
      // For now, we'll add it as a filter when the DB schema supports it
      // where.difficulty = difficulty
    }

    if (topic) {
      where.topics = { has: topic }
    }

    // Fetch organizations with pagination
    const [items, total] = await Promise.all([
      prisma.organizations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.organizations.count({ where }),
    ])

    return NextResponse.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    })
  } catch (error) {
    console.error('Organizations API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}
