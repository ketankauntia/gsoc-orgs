import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { CacheHeaders } from '@/lib/cache'

/**
 * GET /api/v1/organizations/{slug}
 * 
 * Returns detailed information about a specific organization
 * 
 * Caching: Long TTL (30 days) - organization data changes yearly
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const organization = await prisma.organizations.findUnique({
      where: { slug },
    })

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Organization not found',
            code: 'NOT_FOUND',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: organization,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          cached: true,
          cache_ttl: '30 days',
        },
      },
      {
        headers: {
          'Cache-Control': CacheHeaders.LONG,
        },
      }
    )
  } catch (error) {
    console.error('Organization detail API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch organization',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    )
  }
}

