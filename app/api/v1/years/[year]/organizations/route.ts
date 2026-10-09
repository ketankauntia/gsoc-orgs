import { NextRequest, NextResponse } from 'next/server'
import { getCacheHeaderForYear, isHistoricalYear } from '@/lib/cache'
import { jsonObject, organizationV1, type Json } from '@/lib/catalog/legacy-shapes'
import { legacyPaging } from '@/lib/catalog/sql'
import { db } from '@/lib/db'

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
    const { page, limit } = legacyPaging(searchParams, { limit: 50, max: 100 })
    const skip = (page - 1) * limit

    const items = await db()`select * from public.organizations where ${yearNum}::int = any(active_years) order by name`
    const participatingItems = items.filter((row) => {
      const withdrawnYears = jsonObject(row.source_payload as Json).withdrawn_years
      return !Array.isArray(withdrawnYears) || !withdrawnYears.includes(yearNum)
    })
    const total = participatingItems.length

    // Enrich with year-specific data
    const enrichedItems = participatingItems.slice(skip, skip + limit).map((row) => {
      const org = organizationV1(row)
      const yearKey = `year_${yearNum}` as 'year_2016' | 'year_2017' | 'year_2018' | 'year_2019' | 'year_2020' | 'year_2021' | 'year_2022' | 'year_2023' | 'year_2024' | 'year_2025'
      const yearData = org.years?.[yearKey]
      
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
            total: total ?? 0,
            pages: Math.ceil((total ?? 0) / limit),
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

