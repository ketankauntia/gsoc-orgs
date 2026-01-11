# Feature: Production-Grade Caching System

## Summary

Implemented a comprehensive, production-grade caching strategy optimized for the GSoC Organizations Guide's near-static, SEO-critical, read-heavy workload. The system uses a four-layer caching architecture with tag-based invalidation for surgical cache busting.

## Files Created

| File | Purpose |
|------|---------|
| `lib/cache.ts` | Core caching utilities, tags, durations, headers |
| `lib/db.cached.ts` | Cached Prisma query wrappers using `unstable_cache` |
| `app/api/admin/invalidate-cache/route.ts` | Admin endpoint for manual cache invalidation |
| `docs/CACHING_ARCHITECTURE.md` | Complete caching documentation |

## Files Modified

| File | Change |
|------|--------|
| `app/page.tsx` | ISR: 1 hour → 1 day |
| `app/about/page.tsx` | ISR: 1 hour → 30 days |
| `app/privacy-policy/page.tsx` | ISR: 1 hour → 30 days |
| `app/terms-and-conditions/page.tsx` | ISR: 1 hour → 30 days |
| `app/[slug]/page.tsx` | ISR: 1 hour → 1 day |
| `app/[slug]/layout.tsx` | ISR: 1 hour → 1 day |
| `app/organizations/page.tsx` | Removed `force-dynamic`, added ISR: 1 hour |
| `app/organizations/[slug]/page.tsx` | Added ISR: 30 days |
| `app/api/v1/organizations/[slug]/route.ts` | Cache-Control: 30 days |
| `app/api/v1/stats/route.ts` | Cache-Control: 7 days |
| `app/api/v1/years/[year]/organizations/route.ts` | Year-aware caching |
| `app/api/v1/years/[year]/stats/route.ts` | Year-aware caching |

## Design & Architecture Notes

### Four-Layer Caching Architecture

1. **Layer 1: Vercel CDN** - `Cache-Control` headers with `s-maxage`
2. **Layer 2: Next.js ISR** - `export const revalidate = X`
3. **Layer 3: Data Cache** - `unstable_cache` wrapping Prisma queries
4. **Layer 4: Database** - MongoDB (only on cache miss)

### Year-Based Cache Strategy

- **Historical years (2024 and earlier)**: Cached for 1 year (immutable data)
- **Current/upcoming years**: Cached for 1 day (may update during GSoC season)

### Tag-Based Invalidation Hierarchy

```
all
├── organizations
│   └── organization:{slug}
├── projects
│   └── project:{id}
├── years
│   └── year:{year}
├── stats
├── tech-stack
└── topics
```

## Caching Details

### ISR Periods by Page Type

| Page Type | ISR Period |
|-----------|------------|
| Static pages (about, legal) | 30 days |
| Homepage | 1 day |
| Organization details | 30 days |
| Year pages | 1 day |
| Search/filter pages | 1 hour |

### Cache-Control Headers

| Data Type | Header |
|-----------|--------|
| Immutable (historical) | `s-maxage=31536000, stale-while-revalidate=604800` |
| Long-lived | `s-maxage=2592000, stale-while-revalidate=604800` |
| Medium-lived | `s-maxage=604800, stale-while-revalidate=86400` |
| Short-lived | `s-maxage=3600, stale-while-revalidate=86400` |

### Admin Invalidation Endpoint

```
POST /api/admin/invalidate-cache
Headers: x-admin-key: YOUR_KEY

Body options:
- { "type": "all" }
- { "type": "year", "year": 2026 }
- { "type": "organization", "slug": "apache" }
- { "type": "tags", "tags": ["stats"] }
- { "type": "path", "path": "/organizations" }
```

## Notes for Reviewers

### Next.js 16 API Changes

- `revalidateTag()` now requires a second parameter (`profile`)
- Used `"default"` as the cache profile for immediate invalidation

### Known Architecture Decision

Year pages (`/gsoc-[year]-organizations`) use `apiFetchServer` which calls `headers()`, making them dynamic instead of fully static. This is acceptable because:
- ISR still works (1-day revalidation)
- API layer caching applies
- Data layer caching applies
- CDN caching applies

### Future Optimization Opportunity

To achieve full static generation for year pages, refactor to use `lib/db.cached.ts` directly instead of making internal API calls.

## Testing Verification

- ✅ TypeScript compiles without errors
- ✅ Build succeeds
- ✅ ISR periods correctly applied (visible in build output)
- ✅ Pre-commit hooks pass

---

*Generated: January 2026*
