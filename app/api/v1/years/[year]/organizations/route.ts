import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCacheHeaderForYear, isHistoricalYear } from '@/lib/cache'

/**
 * GET /api/v1/years/{year}/organizations
 * 
 * Returns all organizations that participated in a specific year
 * 
 * Caching Strategy:
 * - Historical years (2+ years ago): Immutable data, cache for 1 year
 * - Current/upcoming years: Cache for 1 day with SWR
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const { year } = await params
    const yearNum = parseInt(year)

    if (isNaN(yearNum) || yearNum < 2005 || yearNum > 2030) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid year parameter',
            code: 'INVALID_YEAR',
          },
        },
        { status: 400 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Number(searchParams.get('limit')) || 50)
    const skip = (page - 1) * limit

    const where = {
      active_years: { has: yearNum },
    }

    const [items, total] = await Promise.all([
      prisma.organizations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          slug: true,
          name: true,
          category: true,
          description: true,
          image_url: true,
          img_r2_url: true,
          logo_r2_url: true,
          url: true,
          technologies: true,
          topics: true,
          years: true,
          stats: true,
          first_year: true,
          active_years: true,
        },
      }),
      prisma.organizations.count({ where }),
    ])

    // Enrich with year-specific data
    const enrichedItems = items.map((org) => {
      const yearKey = `year_${yearNum}` as 'year_2016' | 'year_2017' | 'year_2018' | 'year_2019' | 'year_2020' | 'year_2021' | 'year_2022' | 'year_2023' | 'year_2024' | 'year_2025'
      const yearData = org.years[yearKey]
      
      return {
        ...org,
        year_data: yearData || null,
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          year: yearNum,
          organizations: enrichedItems,
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
          cached: true,
          cache_ttl: isHistoricalYear(yearNum) ? '1 year' : '1 day',
        },
      },
      {
        headers: {
          'Cache-Control': getCacheHeaderForYear(yearNum),
        },
      }
    )
  } catch (error) {
    console.error('Year organizations API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch organizations for year',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    )
  }
}

