import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; year: string }> }
) {
  try {
    const { slug, year } = await params

    const organization = await prisma.organizations.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        years: true,
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Access the year data from the years object
    const yearKey = `year_${year}` as keyof typeof organization.years
    const yearData = organization.years?.[yearKey]

    if (!yearData) {
      return NextResponse.json(
        { error: `No data found for year ${year}` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      year: parseInt(year),
      data: yearData,
    })
  } catch (error) {
    console.error('Year data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch year data' },
      { status: 500 }
    )
  }
}
