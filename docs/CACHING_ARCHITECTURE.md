# GSoC Organizations Guide - Caching Architecture

> **Production-Grade Caching Strategy for Near-Static, SEO-Critical Data**

This document describes the complete caching architecture optimized for:
- Near-static, yearly-updated GSoC data
- SEO-critical server-rendered pages
- Vercel + Next.js App Router best practices
- Prisma + MongoDB read-heavy workloads

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Caching Layers](#caching-layers)
3. [Cache Durations](#cache-durations)
4. [Page-Level Caching (ISR)](#page-level-caching-isr)
5. [Data-Level Caching (unstable_cache)](#data-level-caching-unstable_cache)
6. [API Route Caching](#api-route-caching)
7. [Tag-Based Invalidation](#tag-based-invalidation)
8. [Cache Invalidation Workflows](#cache-invalidation-workflows)
9. [DO NOT CACHE List](#do-not-cache-list)
10. [Testing & Verification](#testing--verification)
11. [Common Pitfalls](#common-pitfalls)
12. [File Structure](#file-structure)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           REQUEST FLOW                                          │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │    Client    │
                              └──────┬───────┘
                                     │
                              ┌──────▼───────┐
                              │  Vercel CDN  │  ◄── Layer 1: Edge Caching
                              │  (s-maxage)  │      Cache-Control headers
                              └──────┬───────┘
                                     │ MISS
                              ┌──────▼───────┐
                              │   Next.js    │  ◄── Layer 2: ISR
                              │     ISR      │      export const revalidate = X
                              └──────┬───────┘
                                     │ MISS
                              ┌──────▼───────┐
                              │unstable_cache│  ◄── Layer 3: Data Cache
                              │  (Prisma)    │      Cached DB queries
                              └──────┬───────┘
                                     │ MISS
                              ┌──────▼───────┐
                              │   MongoDB    │  ◄── Layer 4: Database
                              └──────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CACHE INVALIDATION                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

                     POST /api/admin/invalidate-cache
                                     │
                     ┌───────────────┼───────────────┐
                     │               │               │
              ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
              │revalidateTag│ │revalidatePath│ │   CDN      │
              │   (data)    │ │   (page)    │ │  (auto)    │
              └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Caching Layers

### Layer 1: Vercel CDN (Edge Caching)
- **Mechanism**: `Cache-Control` headers with `s-maxage`
- **Location**: Vercel edge network
- **Best for**: API responses, immutable assets
- **TTL**: Year-specific (historical: 1 year, current: 1 day)

### Layer 2: Next.js ISR (Page Caching)
- **Mechanism**: `export const revalidate = X`
- **Location**: Vercel serverless functions
- **Best for**: Server-rendered pages
- **TTL**: Page-specific (see [Page-Level Caching](#page-level-caching-isr))

### Layer 3: Data Cache (unstable_cache)
- **Mechanism**: `unstable_cache` wrapper around Prisma queries
- **Location**: Next.js data cache
- **Best for**: Database query results
- **TTL**: Data-specific with tag-based invalidation

### Layer 4: Database
- **No caching**: Direct MongoDB queries
- **Only used**: On cache misses

---

## Cache Durations

| Duration Name | Seconds | Human Readable | Use Case |
|--------------|---------|----------------|----------|
| `IMMUTABLE` | 31,536,000 | 1 year | Historical year data (2023 and earlier) |
| `LONG` | 2,592,000 | 30 days | Organization data, static pages |
| `MEDIUM` | 604,800 | 7 days | Global stats, tech stack aggregations |
| `SHORT` | 3,600 | 1 hour | Search results, filtered queries |
| `CURRENT_YEAR` | 86,400 | 1 day | Current/upcoming year data |

### Year Classification Logic

```typescript
function isHistoricalYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  // Historical = 2 or more years in the past
  return year < currentYear - 1;
}
```

**Example (if current year is 2026):**
- 2024 and earlier → Historical (1 year cache)
- 2025 → Current (1 day cache)
- 2026+ → Upcoming (1 day cache)

---

## Page-Level Caching (ISR)

### Configuration by Page Type

| Page | Route | ISR Period | Reason |
|------|-------|------------|--------|
| Homepage | `/` | 1 day | Shows trending data |
| About | `/about` | 30 days | Static content |
| Contact | `/contact` | 30 days | Static content |
| Privacy Policy | `/privacy-policy` | 30 days | Legal content |
| Terms | `/terms-and-conditions` | 30 days | Legal content |
| Organizations List | `/organizations` | 1 hour | Search/filter results |
| Organization Detail | `/organizations/[slug]` | 30 days | Org data changes yearly |
| Year Pages | `/gsoc-[year]-organizations` | 1 day | Base; data cache handles year-specific TTL |
| Tech Stack | `/tech-stack/[slug]` | 7 days | Aggregated data |
| Topics | `/topics/[slug]` | 7 days | Aggregated data |

### Implementation Example

```typescript
// app/organizations/[slug]/page.tsx
export const revalidate = 2592000; // 30 days

export default async function OrganizationPage({ params }) {
  // Data fetching uses cached queries from lib/db.cached.ts
  const org = await getOrganizationBySlug(params.slug);
  // ...
}
```

---

## Data-Level Caching (unstable_cache)

### How It Works

```typescript
// lib/db.cached.ts
import { unstable_cache } from 'next/cache';
import prisma from './prisma';
import { CacheTags, CacheDurations } from './cache';

export const getOrganizationBySlug = createDynamicCachedFn(
  'getOrganizationBySlug',
  async (slug: string) => {
    return prisma.organizations.findUnique({
      where: { slug },
    });
  },
  (slug) => ({
    tags: [CacheTags.ALL, CacheTags.ORGANIZATIONS, CacheTags.organization(slug)],
    revalidate: CacheDurations.LONG,
  })
);
```

### Available Cached Queries

| Function | Tags | TTL | Description |
|----------|------|-----|-------------|
| `getOrganizationBySlug(slug)` | `all`, `organizations`, `organization:{slug}` | 30 days | Single org detail |
| `getAllOrganizationSlugs()` | `all`, `organizations` | 30 days | For generateStaticParams |
| `getOrganizationsByYear(year)` | `all`, `years`, `year:{year}`, `organizations` | Year-specific | Year's orgs |
| `getYearStats(year)` | `all`, `years`, `year:{year}`, `stats` | Year-specific | Year statistics |
| `getGlobalStats()` | `all`, `stats` | 7 days | Platform stats |
| `getAllTechnologies()` | `all`, `tech-stack` | 7 days | Tech list |
| `getOrganizationsByTech(tech)` | `all`, `tech-stack`, `tech-stack:{tech}` | 7 days | Orgs by tech |
| `getAllTopics()` | `all`, `topics` | 7 days | Topic list |
| `getProjectById(id)` | `all`, `projects`, `project:{id}` | 30 days | Single project |
| `searchOrganizations(params)` | `all`, `organizations` | 1 hour | Search results |

---

## API Route Caching

### Cache-Control Headers

```typescript
// lib/cache.ts
export const CacheHeaders = {
  IMMUTABLE: 'public, s-maxage=31536000, stale-while-revalidate=604800',
  LONG: 'public, s-maxage=2592000, stale-while-revalidate=604800',
  MEDIUM: 'public, s-maxage=604800, stale-while-revalidate=86400',
  SHORT: 'public, s-maxage=3600, stale-while-revalidate=86400',
  CURRENT_YEAR: 'public, s-maxage=86400, stale-while-revalidate=3600',
  NO_CACHE: 'no-store, no-cache, must-revalidate',
};
```

### Usage in API Routes

```typescript
// app/api/v1/organizations/[slug]/route.ts
import { CacheHeaders } from '@/lib/cache';

export async function GET(request, { params }) {
  const org = await getOrganizationBySlug(params.slug);
  
  return NextResponse.json(
    { success: true, data: org },
    {
      headers: {
        'Cache-Control': CacheHeaders.LONG,
      },
    }
  );
}
```

### Year-Aware Headers

```typescript
// For year-specific endpoints
import { getCacheHeaderForYear } from '@/lib/cache';

return NextResponse.json(data, {
  headers: {
    'Cache-Control': getCacheHeaderForYear(yearNum),
  },
});
```

---

## Tag-Based Invalidation

### Tag Hierarchy

```
all                          ← Invalidates EVERYTHING
├── organizations            ← All organization data
│   └── organization:{slug}  ← Specific organization
├── projects                 ← All project data
│   └── project:{id}         ← Specific project
├── years                    ← All year data
│   └── year:{year}          ← Specific year
├── stats                    ← Global statistics
├── tech-stack               ← Tech aggregations
│   └── tech-stack:{slug}    ← Specific tech
├── topics                   ← Topic aggregations
│   └── topic:{slug}         ← Specific topic
└── meta                     ← Platform metadata
```

### Invalidation Granularity

| Action | Tags to Invalidate |
|--------|-------------------|
| New GSoC year data | `year:{year}`, `stats`, `years` |
| Update single org | `organization:{slug}` |
| Bulk org update | `organizations` |
| Update all data | `all` |

---

## Cache Invalidation Workflows

### Admin Endpoint

```
POST /api/admin/invalidate-cache
Headers: x-admin-key: YOUR_ADMIN_KEY
```

### Workflow: New GSoC Year Data Added

```bash
# 1. Upload new data to MongoDB
# 2. Invalidate year-specific cache
curl -X POST https://yoursite.com/api/admin/invalidate-cache \
  -H "x-admin-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "year", "year": 2026}'

# 3. If needed, invalidate all (for major updates)
curl -X POST https://yoursite.com/api/admin/invalidate-cache \
  -H "x-admin-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "all"}'
```

### Workflow: Single Organization Update

```bash
curl -X POST https://yoursite.com/api/admin/invalidate-cache \
  -H "x-admin-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "organization", "slug": "apache"}'
```

### Workflow: Invalidate Specific Tags

```bash
curl -X POST https://yoursite.com/api/admin/invalidate-cache \
  -H "x-admin-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "tags", "tags": ["stats", "tech-stack"]}'
```

---

## DO NOT CACHE List

These routes should **NEVER** be cached:

| Route | Reason |
|-------|--------|
| `/api/admin/*` | Admin operations must be real-time |
| `/api/health` | Must reflect actual server status |
| `/api/v1/health` | Must reflect actual server status |
| POST/PUT/DELETE routes | Write operations |

### Implementation

```typescript
// Admin routes use NO_CACHE header
return NextResponse.json(data, {
  headers: {
    'Cache-Control': CacheHeaders.NO_CACHE,
  },
});
```

---

## Testing & Verification

### 1. Verify Cache Headers (Local)

```bash
# Start production build locally
pnpm build && pnpm start

# Check API response headers
curl -I http://localhost:3000/api/v1/organizations/apache

# Look for:
# Cache-Control: public, s-maxage=2592000, stale-while-revalidate=604800
```

### 2. Verify on Vercel

```bash
# Check deployed API
curl -I https://yoursite.com/api/v1/organizations/apache

# Look for:
# x-vercel-cache: HIT (cached)
# x-vercel-cache: MISS (not cached yet)
# x-vercel-cache: STALE (serving stale while revalidating)
```

### 3. Verify ISR Pages

```bash
# Check page headers
curl -I https://yoursite.com/organizations/apache

# Look for:
# x-vercel-cache: HIT
# x-nextjs-cache: HIT
```

### 4. Test Cache Invalidation

```bash
# 1. Make a request (should cache)
curl https://yoursite.com/api/v1/stats

# 2. Invalidate
curl -X POST https://yoursite.com/api/admin/invalidate-cache \
  -H "x-admin-key: YOUR_KEY" \
  -d '{"type": "tags", "tags": ["stats"]}'

# 3. Make request again (should see updated data)
curl https://yoursite.com/api/v1/stats
```

### 5. Verify Database Queries (Development)

```bash
# Enable Prisma query logging in development
# Check console for query logs
# After first request: Should see queries
# After second request: Should see NO queries (cached)
```

---

## Known Architecture Decisions

### Year Pages Use Dynamic Rendering

The year pages (`/gsoc-[year]-organizations`) currently use `apiFetchServer` which calls `headers()`,
making them dynamic instead of fully static. This is acceptable because:

1. **ISR still works**: The 1-day revalidation period applies
2. **API caching applies**: The API endpoints have long Cache-Control headers
3. **Data caching applies**: `unstable_cache` wraps database queries
4. **CDN caching applies**: Vercel CDN caches the responses

**Future Optimization**: To achieve full static generation, refactor year pages to use
`lib/db.cached.ts` directly instead of making internal API calls.

---

## Common Pitfalls

### ❌ Pitfall 1: Using `cache: 'no-store'` Everywhere

```typescript
// BAD - Bypasses all caching
fetch(url, { cache: 'no-store' });

// GOOD - Use default or explicit caching
fetch(url); // Uses Next.js defaults
fetch(url, { next: { revalidate: 3600 } }); // Explicit ISR
```

### ❌ Pitfall 2: Mixing `dynamic` and `revalidate`

```typescript
// BAD - These conflict
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

// GOOD - Use one or the other
export const revalidate = 3600;
```

### ❌ Pitfall 3: Not Using Tags

```typescript
// BAD - Can't invalidate selectively
unstable_cache(fn, ['key'], { revalidate: 3600 });

// GOOD - Tagged for surgical invalidation
unstable_cache(fn, ['key'], { 
  tags: ['organizations', 'organization:apache'],
  revalidate: 3600 
});
```

### ❌ Pitfall 4: Caching User-Specific Data

```typescript
// BAD - Would serve same response to all users
const userData = await getCachedUserData(userId);

// GOOD - This app has no user data, but if it did:
// - Use middleware for auth
// - Don't cache personalized responses
```

### ❌ Pitfall 5: Forgetting SWR in Cache-Control

```typescript
// BAD - No graceful updates
'Cache-Control': 'public, s-maxage=3600'

// GOOD - Serves stale while revalidating
'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
```

### ❌ Pitfall 6: Using `max-age` for CDN Caching

```typescript
// BAD - Caches in browser too
'Cache-Control': 'public, max-age=3600'

// GOOD - Only CDN caches, browser fetches fresh
'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
```

---

## File Structure

```
lib/
├── cache.ts              # Cache utilities, tags, durations, headers
├── db.cached.ts          # Cached Prisma query wrappers
├── prisma.ts             # Prisma client (unchanged)
└── ...

app/
├── api/
│   ├── admin/
│   │   └── invalidate-cache/
│   │       └── route.ts  # Cache invalidation endpoint
│   └── v1/
│       └── ...           # API routes with Cache-Control headers
├── [slug]/
│   └── page.tsx          # Year pages with ISR
├── organizations/
│   ├── page.tsx          # List page with ISR
│   └── [slug]/
│       └── page.tsx      # Detail page with ISR
└── ...

docs/
└── CACHING_ARCHITECTURE.md  # This file
```

---

## Summary

### Expected Performance After Implementation

| Metric | Before | After |
|--------|--------|-------|
| Database queries per historical page | Every request | ~0 (cached for 1 year) |
| Database queries per current year page | Every request | ~0 (cached for 1 day) |
| Cold start latency | High | Unchanged |
| Warm request latency | ~500ms | <50ms |
| Vercel bandwidth | High | Minimal (CDN serves) |
| Traffic spike handling | Limited | Excellent (CDN absorbs) |

### Key Principles

1. **Historical data is immutable** → Cache aggressively (1 year)
2. **Current year data may change** → Cache conservatively (1 day)
3. **Use tags** → Enable surgical invalidation
4. **Layer caching** → CDN → ISR → Data Cache → DB
5. **No user data** → Safe to cache everything
6. **SEO-critical** → Always server-render, never client-only cache
