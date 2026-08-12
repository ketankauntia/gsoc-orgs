import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminKeyAuthorized } from '@/lib/admin-key'

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
  // Check authentication
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

    // Fetch all organizations
    const admin = createAdminClient()
    const { data: allOrgs, error: fetchError } = await admin
      .from('organizations')
      .select('id,slug,name,first_year,active_years')
    if (fetchError) throw fetchError

    console.log(`Found ${allOrgs.length} organizations to process`)

    let updatedCount = 0
    let firstTimeCount = 0

    // Process each organization
    // An org is "first-time" for a target year if:
    // - Its first_year equals the target year
    // - This means it never appeared in GSoC before this year
    for (const org of allOrgs) {
      const isFirstTime = org.first_year === targetYear

      // Update the organization
      const { error: updateError } = await admin
        .from('organizations')
        .update({ first_time: isFirstTime })
        .eq('id', org.id)
      if (updateError) throw updateError

      updatedCount++

      if (isFirstTime) {
        firstTimeCount++
      }

      // Log progress every 50 organizations
      if (updatedCount % 50 === 0) {
        console.log(`Processed ${updatedCount}/${allOrgs.length} organizations...`)
      }
    }

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
 * Note: This endpoint is public (no authentication required) for open source usage
 */
export async function GET(request: NextRequest) {
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
    const admin = createAdminClient()
    const [totalResult, firstTimeResult, yearResult] = await Promise.all([
      admin.from('organizations').select('id', { count: 'exact', head: true }),
      admin.from('organizations').select('id', { count: 'exact', head: true }).eq('first_time', true).eq('first_year', targetYear),
      admin.from('organizations').select('id', { count: 'exact', head: true }).contains('active_years', [targetYear]),
    ])
    if (totalResult.error || firstTimeResult.error || yearResult.error) {
      throw totalResult.error ?? firstTimeResult.error ?? yearResult.error
    }
    const totalOrgs = totalResult.count ?? 0
    const firstTimeOrgs = firstTimeResult.count ?? 0
    const orgsForYear = yearResult.count ?? 0

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

