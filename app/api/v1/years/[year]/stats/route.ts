import { NextResponse } from 'next/server'
import { getCacheHeaderForYear, isHistoricalYear } from '@/lib/cache'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/v1/years/{year}/stats
 * 
 * Returns statistics for a specific GSoC year
 * 
 * Caching Strategy:
 * - Historical years: Immutable data, cache for 1 year
 * - Current/upcoming years: Cache for 1 day
 */
export async function GET(
  request: Request,
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

    const { data: organizations, error } = await createAdminClient()
      .from('organizations')
      .select('category,source_payload')
      .contains('active_years', [yearNum])
    if (error) throw error

    // Aggregate stats for the year
    let totalProjects = 0
    let totalStudents = 0
    const categoryCounts = new Map<string, number>()
    const techCounts = new Map<string, number>()
    const topicCounts = new Map<string, number>()

    const yearKey = `year_${yearNum}` as 'year_2016' | 'year_2017' | 'year_2018' | 'year_2019' | 'year_2020' | 'year_2021' | 'year_2022' | 'year_2023' | 'year_2024' | 'year_2025'

    ;(organizations ?? []).forEach((org) => {
      const source = org.source_payload ?? {}
      const projectsCount = (source.stats?.projects_by_year?.[yearKey] as number) || 0
      const studentsCount = (source.stats?.students_by_year?.[yearKey] as number) || projectsCount

      totalProjects += projectsCount
      totalStudents += studentsCount

      // Count categories
      categoryCounts.set(
        org.category,
        (categoryCounts.get(org.category) || 0) + 1
      )

      // Count technologies
      ;(source.technologies ?? []).forEach((tech: string) => {
        techCounts.set(tech, (techCounts.get(tech) || 0) + 1)
      })

      // Count topics
      ;(source.topics ?? []).forEach((topic: string) => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
      })
    })

    // Convert to arrays and sort
    const topCategories = Array.from(categoryCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const topTechnologies = Array.from(techCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    const topTopics = Array.from(topicCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    return NextResponse.json(
      {
        success: true,
        data: {
          year: yearNum,
          overview: {
            total_organizations: organizations?.length ?? 0,
            total_projects: totalProjects,
            total_students: totalStudents,
            avg_projects_per_org: (organizations?.length ?? 0) > 0
              ? Math.round((totalProjects / organizations!.length) * 100) / 100
              : 0,
          },
          categories: topCategories,
          technologies: topTechnologies,
          topics: topTopics,
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
    console.error('Year stats API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch year statistics',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    )
  }
}

