import { NextResponse } from 'next/server'

const METRIC_NAMES = new Set(['CLS', 'FCP', 'INP', 'LCP', 'TTFB'])

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > 4096) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    const body = await request.json() as Record<string, unknown>
    if (
      typeof body.name !== 'string' ||
      !METRIC_NAMES.has(body.name) ||
      typeof body.value !== 'number' ||
      !Number.isFinite(body.value) ||
      typeof body.routeFamily !== 'string' ||
      body.routeFamily.length > 40 ||
      (typeof body.pathname === 'string' && body.pathname.length > 240)
    ) {
      return NextResponse.json({ error: 'Invalid metric' }, { status: 400 })
    }

    // Structured logs can be grouped by routeFamily in the deployment log sink.
    console.info('web_vital', {
      name: body.name,
      value: body.value,
      rating: body.rating,
      routeFamily: body.routeFamily,
      pathname: body.pathname,
      navigationType: body.navigationType,
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
