import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdminKeyAuthorized } from '@/lib/admin-key'

/** Both methods need the x-admin-key header; without ADMIN_KEY set the route does not exist. */
function adminKeyGate(request: NextRequest) {
  if (!process.env.ADMIN_KEY) {
    return NextResponse.json({ success: false, error: { message: 'Not found', code: 'NOT_FOUND' } }, { status: 404 })
  }
  if (!isAdminKeyAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Unauthorized. Admin key required.',
          code: 'UNAUTHORIZED',
        },
      },
      { status: 401 }
    )
  }
  return null
}

/**
 * POST /api/admin/compute-first-time
 * 
 * Computes and updates the first_time field for all organizations based on a target year.
 * 
 * Headers:
 * - x-admin-key: Admin authentication key (must match ADMIN_KEY env variable)
 * 
 * Query Parameters:
 * - year: number (optional, defaults to current year)
 * 
 * Logic:
 * - An organization is "first-time" if it never appeared before the target year
 * - i.e., first_year === targetYear AND no previous years exist before targetYear
 * 
 * This endpoint should be run:
 * - After new GSoC organizations are added for a new year
 * - To refresh first_time status for all organizations
 */
export async function POST(request: NextRequest) {
  const denied = adminKeyGate(request)
  if (denied) return denied

  try {
    const searchParams = request.nextUrl.searchParams
    const targetYearParam = searchParams.get('year')
    
    // Default to current year if not provided
    const currentYear = new Date().getFullYear()
    const targetYear = targetYearParam ? parseInt(targetYearParam) : currentYear

    if (isNaN(targetYear) || targetYear < 2005 || targetYear > 2100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid year parameter. Must be between 2005 and 2100.',
            code: 'INVALID_YEAR',
          },
        },
        { status: 400 }
      )
    }

    console.log(`Computing first_time field for year ${targetYear}...`)

    // An org is "first-time" for a target year if its first_year equals the
    // target year, meaning it never appeared in GSoC before.
    const [result] = await db()`
      with updated as (
        update public.organizations set first_time = (first_year is not distinct from ${targetYear}::int) returning first_time
      )
      select count(*)::int as updated, count(*) filter (where first_time)::int as first_time from updated`
    const updatedCount = Number(result.updated)
    const firstTimeCount = Number(result.first_time)
    const allOrgs = { length: updatedCount }

    console.log(
      `Completed! Updated ${updatedCount} organizations. Found ${firstTimeCount} first-time organizations for year ${targetYear}.`
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          targetYear,
          totalOrganizations: allOrgs.length,
          updatedCount,
          firstTimeCount,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error computing first_time field:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to compute first_time field',
          code: 'COMPUTATION_ERROR',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/compute-first-time
 * 
 * Returns information about the first_time computation status
 *
 * Headers:
 * - x-admin-key: Admin authentication key (must match ADMIN_KEY env variable)
 */
export async function GET(request: NextRequest) {
  const denied = adminKeyGate(request)
  if (denied) return denied

  try {
    const searchParams = request.nextUrl.searchParams
    const targetYearParam = searchParams.get('year')
    
    const currentYear = new Date().getFullYear()
    const targetYear = targetYearParam ? parseInt(targetYearParam) : currentYear

    if (isNaN(targetYear) || targetYear < 2005 || targetYear > 2100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid year parameter. Must be between 2005 and 2100.',
            code: 'INVALID_YEAR',
          },
        },
        { status: 400 }
      )
    }

    // Get statistics
    const [counts] = await db()`
      select count(*)::int as total,
        count(*) filter (where first_time and first_year = ${targetYear}::int)::int as first_time,
        count(*) filter (where ${targetYear}::int = any(active_years))::int as for_year
      from public.organizations`
    const totalOrgs = Number(counts.total)
    const firstTimeOrgs = Number(counts.first_time)
    const orgsForYear = Number(counts.for_year)

    return NextResponse.json(
      {
        success: true,
        data: {
          targetYear,
          totalOrganizations: totalOrgs,
          organizationsForYear: orgsForYear,
          firstTimeOrganizations: firstTimeOrgs,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching first_time statistics:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch first_time statistics',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    )
  }
}

