import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/v1/gsoc-organizations/{slug}
 * 
 * Returns detailed information about a specific organization
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
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
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

