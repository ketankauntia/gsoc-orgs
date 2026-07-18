'use client'

import { useReportWebVitals } from 'next/web-vitals'

function getRouteFamily(pathname: string) {
  if (document.querySelector('[data-not-found]')) return 'not-found'
  if (pathname === '/') return 'home'
  if (/^\/organizations\/[^/]+\/projects\/[^/]+$/.test(pathname)) return 'project-detail'
  if (/^\/organizations\/[^/]+$/.test(pathname)) return 'organization-detail'
  if (pathname === '/organizations') return 'organizations-index'
  if (/^\/projects\/[^/]+$/.test(pathname)) return 'projects-year'
  if (pathname === '/projects') return 'projects-index'
  if (/^\/tech-stack\/[^/]+$/.test(pathname)) return 'technology-detail'
  if (pathname === '/tech-stack') return 'technology-index'
  if (/^\/topics\/[^/]+$/.test(pathname)) return 'topic-detail'
  if (pathname === '/topics') return 'topic-index'
  if (/^\/yearly\/[^/]+$/.test(pathname) || /^\/gsoc-\d{4}-organizations$/.test(pathname)) return 'year-detail'
  if (pathname === '/yearly') return 'year-index'
  if (/^\/blog\/post\/[^/]+$/.test(pathname)) return 'blog-post'
  if (pathname.startsWith('/blog')) return 'blog-index'
  return 'static'
}

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const pathname = window.location.pathname
    const payload = JSON.stringify({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
      routeFamily: getRouteFamily(pathname),
      pathname,
    })

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/telemetry/web-vitals',
        new Blob([payload], { type: 'application/json' })
      )
      return
    }

    void fetch('/api/telemetry/web-vitals', {
      method: 'POST',
      body: payload,
      headers: { 'content-type': 'application/json' },
      keepalive: true,
    })
  })

  return null
}
