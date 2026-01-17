# Backend API Architecture Documentation

> **Purpose**: This document enables engineers to audit performance, correctness, and scalability of the GSoC Organizations API. It covers query patterns, caching strategies, and optimization opportunities.

---

## Table of Contents

1. [Global Architecture](#global-architecture)
2. [Core Routes (Legacy `/api/`)](#core-routes-legacy-api)
   - [/api/organizations](#apiorganizations)
   - [/api/projects](#apiprojects)
   - [/api/stats](#apistats)
   - [/api/tech-stack](#apitech-stack)
   - [/api/tech-stack/:slug](#apitech-stackslug)
   - [/api/tech-stack/analytics](#apitech-stackanalytics)
   - [/api/health](#apihealth)
   - [/api/waitlist](#apiwaitlist)
3. [V1 API Routes](#v1-api-routes)
   - [/api/v1](#apiv1)
   - [/api/v1/meta](#apiv1meta)
   - [/api/v1/health](#apiv1health)
   - [/api/v1/organizations](#apiv1organizations)
   - [/api/v1/organizations/:slug](#apiv1organizationsslug)
   - [/api/v1/projects](#apiv1projects)
   - [/api/v1/stats](#apiv1stats)
   - [/api/v1/years](#apiv1years)
   - [/api/v1/years/:year/organizations](#apiv1yearsyearorganizations)
   - [/api/v1/years/:year/stats](#apiv1yearsyearstats)
   - [/api/v1/tech-stack](#apiv1tech-stack)
   - [/api/v1/tech-stack/:slug](#apiv1tech-stackslug)
4. [Admin Routes](#admin-routes)
   - [/api/admin/compute-first-time](#apiadmincompute-first-time)
   - [/api/admin/invalidate-cache](#apiadmininvalidate-cache)
5. [Performance Bottlenecks Summary](#performance-bottlenecks-summary)
6. [Recommendations](#recommendations)

---

## Global Architecture

### Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Database | MongoDB via Prisma |
| Caching | `unstable_cache` + HTTP Cache-Control headers |
| Deployment | Vercel Edge |

### Data Flow

```
┌─────────────┐    SSR/API     ┌─────────────┐    Prisma    ┌─────────────┐
│   Browser   │ ────────────▶  │   Next.js   │ ──────────▶  │   MongoDB   │
│   or Page   │                │   Route     │              │   Atlas     │
└─────────────┘                └─────────────┘              └─────────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │  unstable_  │
                              │   cache     │
                              └─────────────┘
```

### SSR vs CSR Patterns

| Pattern | Where Used | Implication |
|---------|------------|-------------|
| **SSR** | Organization pages, Year pages, Tech-stack pages | Data fetched at request time, cached via ISR |
| **CSR** | Search/filter on organization list, Client-side filtering | API calls from browser |

### Cache Architecture

The caching system uses a hierarchical tag structure:

```
all                         # Invalidates entire cache
├── organizations          # All organization data
│   └── organization:{slug} # Specific organization
├── years                  # Year listings
│   └── year:{year}        # Specific year data
├── projects               # All projects
│   └── project:{id}       # Specific project
├── stats                  # Global statistics
├── tech-stack             # Tech stack aggregations
│   └── tech-stack:{slug}  # Specific technology
├── topics                 # Topic aggregations
└── meta                   # API metadata
```

### Cache Duration Strategy

| Data Type | Duration | Rationale |
|-----------|----------|-----------|
| **IMMUTABLE** | 1 year (365 days) | Historical year data (e.g., 2020, 2021) |
| **LONG** | 30 days | Organization data (changes yearly) |
| **MEDIUM** | 7 days | Aggregated stats |
| **CURRENT_YEAR** | 1 day | Current/upcoming year data |
| **SEARCH** | 1 hour | Search/filter results |

### Where Performance Regressions Are Likely

1. **Full table scans** in aggregation routes (`/api/v1/years`, `/api/stats`, `/api/tech-stack`)
2. **Tech-stack analytics** - most expensive route, scans all orgs and iterates all years/projects
3. **Search with text matching** - uses `contains` which cannot use indexes effectively
4. **Year-based org retrieval** - returns full `years` object which contains all projects

---

## Core Routes (Legacy `/api/`)

### /api/organizations

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/organizations` |
| Access | Public |
| Callers | Organization list page, search UI |

#### Request Details

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Results per page (max: 100) |
| `q` | string | - | Search in name/description |
| `years` | string | - | Comma-separated years |
| `yearsLogic` | `AND`\|`OR` | `OR` | Logic for year filtering |
| `categories` | string | - | Comma-separated categories |
| `techs` | string | - | Comma-separated technologies |
| `techsLogic` | `AND`\|`OR` | `OR` | Logic for tech filtering |
| `topics` | string | - | Comma-separated topics |
| `topicsLogic` | `AND`\|`OR` | `OR` | Logic for topic filtering |
| `firstTimeOnly` | boolean | false | Filter first-time orgs |

#### Database Interaction

```prisma
prisma.organizations.findMany({
  where: {
    AND: [
      { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] },
      { OR: years.map(year => ({ active_years: { has: year } })) },
      { OR: categories.map(category => ({ category })) },
      { OR: techs.map(tech => ({ technologies: { has: tech } })) },
    ]
  },
  select: { /* 16 fields - excludes years (heavy) */ },
  skip, take, orderBy: { name: 'asc' }
})
```

| Property | Value |
|----------|-------|
| Collection | `organizations` |
| Query Type | `findMany` + `count` |
| Indexed Fields | `name`, `category`, `is_currently_active`, `total_projects`, `first_time`, `slug` |
| Index-Friendly? | ⚠️ Partial - text search uses `contains` which scans |

#### Performance Characteristics

| Metric | Value |
|--------|-------|
| Typical Response | ~100-300ms |
| Worst-Case | ~800ms (complex filters + text search) |
| Payload Size | ~50KB for 20 items |
| Bottleneck | Text search with `contains` is not index-optimized |

#### Caching Behavior

| Property | Value |
|----------|-------|
| `unstable_cache` | ❌ Not used (dynamic filters) |
| Cache-Control | Not set |
| Safe to Cache? | ⚠️ Only with stable query params |

#### Problems / Risks

1. **Text search with `contains`** - performs regex-like scan, not using text index
2. **OR logic across arrays** - creates complex $or queries
3. **No HTTP caching** - every request hits DB

#### Recommendations

1. Add MongoDB text index on `name` + `description`
2. Replace `contains` with `$text` search for better performance
3. Add `Cache-Control: public, s-maxage=300` for common searches
4. Consider precomputing popular search results

---

### /api/projects

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/projects` |
| Access | Public |
| Callers | Projects listing, organization detail pages |

#### Request Details

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Results per page (max: 100) |
| `q` | string | - | Search in title/abstract/org |
| `year` | number | - | Filter by year |
| `org` | string | - | Filter by org slug |

#### Database Interaction

```prisma
prisma.projects.findMany({
  where: {
    OR: [{ project_title: { contains } }, { project_abstract_short: { contains } }, { org_name: { contains } }],
    year: parseInt(year),
    org_slug: orgSlug
  },
  orderBy: { date_updated: 'desc' }
})
```

| Property | Value |
|----------|-------|
| Collection | `projects` |
| Query Type | `findMany` + `count` |
| Indexed Fields | `project_id`, `org_canonical_id`, `year` |
| Index-Friendly? | ✅ Yes (when filtering by year/org), ⚠️ No (text search) |

#### Performance Characteristics

| Metric | Value |
|--------|-------|
| Typical Response | ~50-150ms |
| Worst-Case | ~500ms (text search across all projects) |
| Payload Size | ~30KB for 20 items |
| Bottleneck | Text search on large project descriptions |

#### Caching Behavior

| Property | Value |
|----------|-------|
| `unstable_cache` | ❌ Not used |
| Cache-Control | Not set |
| Safe to Cache? | ⚠️ Only with stable query params |

#### Recommendations

1. Add text index on `project_title` + `project_abstract_short`
2. Add `Cache-Control: s-maxage=1800` header
3. Consider pagination optimization for deep pages

---

### /api/stats

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/stats` |
| Access | Public |
| Callers | Homepage, dashboard widgets |

#### Database Interaction

```prisma
Promise.all([
  prisma.organizations.count(),
  prisma.organizations.count({ where: { is_currently_active: true } }),
  prisma.projects.count(),
  prisma.organizations.findMany({ select: { technologies: true } })  // Full scan!
])
```

| Property | Value |
|----------|-------|
| Collection | `organizations`, `projects` |
| Query Type | `count` (3x), `findMany` (1x) |
| Index-Friendly? | ✅ Counts use indexes, ⚠️ `findMany` for unique techs is full scan |

#### Performance Characteristics

| Metric | Value |
|--------|-------|
| Typical Response | ~200-400ms |
| Worst-Case | ~800ms |
| Payload Size | ~1KB |
| Bottleneck | **Full table scan for unique technologies** |

#### Caching Behavior

| Property | Value |
|----------|-------|
| `unstable_cache` | ❌ Not used directly |
| Cache-Control | Not set |
| Safe to Cache? | ✅ Yes - stats change rarely |

#### Problems / Risks

> [!CAUTION]
> **Full table scan** to calculate unique technologies. Fetches all organizations just to extract `technologies` arrays.

#### Recommendations

1. **Precompute** unique technology count and store in a separate collection
2. Use `unstable_cache` with 7-day TTL
3. Add `Cache-Control: public, s-maxage=604800` (7 days)

---

### /api/tech-stack

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/tech-stack` |
| Access | Public |
| Callers | Tech stack index page |

#### Request Details

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 200 | Max techs to return (max: 500) |
| `q` | string | - | Search filter |

#### Database Interaction

```prisma
prisma.organizations.findMany({
  select: { technologies: true }  // Full table scan!
})
```

| Property | Value |
|----------|-------|
| Collection | `organizations` |
| Query Type | `findMany` (full scan) |
| Index-Friendly? | ❌ No - full collection scan |

#### Performance Characteristics

| Metric | Value |
|--------|-------|
| Typical Response | ~150-300ms |
| Worst-Case | ~600ms |
| Payload Size | ~5KB |
| Bottleneck | **Full table scan to aggregate technologies** |

#### Problems / Risks

> [!WARNING]
> Every request scans the entire organizations collection to extract and count technologies.

#### Recommendations

1. Create `tech_stack_summary` collection with precomputed counts
2. Update via admin endpoint or scheduled job
3. Use `unstable_cache` with 7-day TTL

---

### /api/tech-stack/:slug

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/tech-stack/[slug]` |
| Access | Public |
| Callers | Tech stack detail pages |

#### Database Interaction

```prisma
// First: Find all tech variations (FULL SCAN!)
prisma.organizations.findMany({
  select: { technologies: true },
  take: 1000
})

// Then: Find orgs with that tech
prisma.organizations.findMany({
  where: { technologies: { hasSome: variations } },
  select: { /* 12 fields */ }
})
```

| Property | Value |
|----------|-------|
| Collection | `organizations` |
| Query Type | `findMany` (2x) |
| Index-Friendly? | ⚠️ `hasSome` on array is partially indexed |

#### Performance Characteristics

| Metric | Value |
|--------|-------|
| Typical Response | ~200-400ms |
| Worst-Case | ~1s |
| Payload Size | ~20-100KB depending on tech popularity |
| Bottleneck | **Double scan** - first for variations, then for orgs |

#### Problems / Risks

> [!CAUTION]
> **Two full table scans**: First to find technology name variations, then to find organizations.

#### Recommendations

1. Precompute tech name → canonical name mapping
2. Use single query with known canonical name
3. Cache tech variation lookups with 30-day TTL

---

### /api/tech-stack/analytics

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/tech-stack/analytics` |
| Access | Public |
| Callers | Tech stack index page charts |

#### Database Interaction

```prisma
prisma.organizations.findMany({
  select: {
    id_: true, name: true, slug: true,
    technologies: true, active_years: true,
    years: true,  // HEAVY - contains all project data!
    total_projects: true, is_currently_active: true
  }
})
```

| Property | Value |
|----------|-------|
| Collection | `organizations` |
| Query Type | `findMany` (full scan with heavy projection) |
| Index-Friendly? | ❌ No - full scan with large payload |

#### Performance Characteristics

| Metric | Value |
|--------|-------|
| Typical Response | ~500-1000ms |
| Worst-Case | ~3s+ |
| Payload Size | Response is small, but **query fetches ~50MB** |
| Bottleneck | **CRITICAL: Fetches ALL projects nested in years for ALL orgs** |

#### Problems / Risks

> [!CAUTION]
> **MOST EXPENSIVE ROUTE IN THE API**
> - Fetches `years` field which contains ALL historical projects for EVERY organization
> - Iterates through all years × all projects × all technologies in JavaScript
> - Heavy in-memory aggregation with Maps

#### Recommendations

1. **Critical**: Remove `years` from select, use precomputed aggregates
2. Create `tech_analytics` collection with precomputed data:
   - Technology popularity by year
   - Difficulty distribution by technology
   - Selection counts by year
3. Run computation via admin endpoint, cache results for 30 days
4. Add `Cache-Control: public, s-maxage=2592000` (30 days)

---

### /api/health

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/health` |
| Access | Public |
| Callers | Monitoring, load balancers |

#### Database Interaction

```prisma
prisma.organizations.count({ take: 1 })  // Simple connectivity check
```

#### Performance Characteristics

| Metric | Value |
|--------|-------|
| Typical Response | ~10-50ms |
| Payload Size | ~100 bytes |

#### Caching Behavior

| Property | Value |
|----------|-------|
| `unstable_cache` | ❌ Never cache health checks |
| Cache-Control | Should be `no-store` |

---

### /api/waitlist

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `POST` only |
| Route Path | `/api/waitlist` |
| Access | Public (rate-limited) |
| Callers | Waitlist signup form |

#### Request Details

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | ✅ | Valid email address |
| `interests` | string[] | ❌ | `["ai-features", "gsoc-tools"]` |

#### Database Interaction

```prisma
prisma.waitlist_entries.upsert({
  where: { email },
  update: { interests },
  create: { email, interests, source: "website" }
})
```

| Property | Value |
|----------|-------|
| Collection | `waitlist_entries` |
| Query Type | `upsert` (idempotent) |
| Index-Friendly? | ✅ Yes - unique index on email |

#### Security Features

- **Rate limiting**: 5 requests/minute per IP
- **Email validation**: Regex + length checks
- **No enumeration**: Always returns `{ success: true }`
- **Closed interest set**: Only accepts predefined values

#### Caching Behavior

| Property | Value |
|----------|-------|
| Cache-Control | `no-store` (always) |
| `dynamic` | `force-dynamic` |

---

## V1 API Routes

### /api/v1

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/v1` |
| Access | Public |
| Purpose | API root with quick links |

#### Caching

- `Cache-Control: public, s-maxage=86400` (1 day)
- No database calls

---

### /api/v1/meta

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/v1/meta` |
| Access | Public |
| Purpose | API documentation endpoint |

#### Caching

- `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`
- No database calls (static response)

---

### /api/v1/health

Same as `/api/health`.

---

### /api/v1/organizations

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/v1/organizations` |
| Access | Public |
| Callers | External API consumers |

#### Request Details

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Max 100 |
| `q` | string | - | Search query |
| `year` | number | - | Filter by year |
| `technology` | string | - | Filter by tech |
| `category` | string | - | Filter by category |
| `active` | boolean | - | Filter by active status |
| `sort` | string | `name` | `name`\|`projects`\|`year` |

#### Database Interaction

Similar to `/api/organizations` but simpler filter logic (single values, not arrays).

#### Caching Behavior

- `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`

---

### /api/v1/organizations/:slug

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/v1/organizations/[slug]` |
| Access | Public |
| Callers | Organization detail pages, external API |

#### Database Interaction

```prisma
prisma.organizations.findUnique({
  where: { slug }
})  // Returns ALL fields including heavy `years`
```

| Property | Value |
|----------|-------|
| Collection | `organizations` |
| Query Type | `findUnique` |
| Index-Friendly? | ✅ Yes - unique index on `slug` |

#### Performance Characteristics

| Metric | Value |
|--------|-------|
| Typical Response | ~30-80ms |
| Payload Size | ~100-500KB (includes all historical project data in `years`) |
| Bottleneck | Large payload due to embedded `years` data |

#### Caching Behavior

- `Cache-Control: public, s-maxage=2592000, stale-while-revalidate=604800` (30 days)

#### Problems / Risks

> [!WARNING]
> Returns full `years` object which can be 100KB+ for established organizations. Consider lazy-loading project data.

---

### /api/v1/projects

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/v1/projects` |
| Access | Public |

#### Request Details

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Max 100 |
| `q` | string | - | Search in title/abstract/org/contributor |
| `year` | number | - | Filter by year |
| `org` | string | - | Filter by org slug |

#### Database Interaction

Uses `projects` collection with indexes on `year` and `org_slug`.

#### Caching Behavior

- `Cache-Control: public, s-maxage=1800, stale-while-revalidate=3600` (30 min)

---

### /api/v1/stats

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/v1/stats` |
| Access | Public |
| Callers | Dashboard, homepage |

#### Database Interaction

```prisma
Promise.all([
  prisma.organizations.count(),
  prisma.organizations.count({ where: { is_currently_active: true } }),
  prisma.projects.count(),
  prisma.organizations.findMany({
    select: { technologies: true, topics: true, category: true, active_years: true, first_year: true, last_year: true }
  })  // Full scan!
])
```

#### Performance Characteristics

| Metric | Value |
|--------|-------|
| Typical Response | ~300-600ms |
| Worst-Case | ~1s |
| Bottleneck | Full table scan for aggregations |

#### Caching Behavior

- `Cache-Control: public, s-maxage=604800, stale-while-revalidate=86400` (7 days)

---

### /api/v1/years

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/v1/years` |
| Access | Public |
| Callers | Year selector, navigation |

#### Database Interaction

```prisma
prisma.organizations.findMany({
  select: { active_years: true, first_year: true, last_year: true, stats: true }
})  // Full scan to aggregate years
```

| Property | Value |
|----------|-------|
| Collection | `organizations` |
| Query Type | `findMany` (full scan) |
| Index-Friendly? | ❌ No |

#### Performance Characteristics

| Metric | Value |
|--------|-------|
| Typical Response | ~200-400ms |
| Payload Size | ~2KB |
| Bottleneck | Full scan to extract year data from all orgs |

#### Caching Behavior

- `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`

#### Recommendations

1. Create `years_summary` collection with precomputed year stats
2. Use `unstable_cache` with 30-day TTL

---

### /api/v1/years/:year/organizations

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/v1/years/[year]/organizations` |
| Access | Public |
| Callers | Year-specific organization pages |

#### Database Interaction

```prisma
prisma.organizations.findMany({
  where: { active_years: { has: yearNum } },
  select: { /* 14 fields including years and stats */ }
})
```

| Property | Value |
|----------|-------|
| Collection | `organizations` |
| Query Type | `findMany` + `count` |
| Filter | `active_years: { has: year }` |
| Index-Friendly? | ⚠️ Partial - array `has` operation |

#### Performance Characteristics

| Metric | Value |
|--------|-------|
| Typical Response | ~150-400ms |
| Worst-Case | ~800ms (current year with many orgs) |
| Payload Size | ~200KB+ (includes `years` and `stats` objects) |

#### Caching Behavior

**Year-dependent caching**:
- Historical years (≤2024): `s-maxage=31536000` (1 year)
- Current/upcoming years: `s-maxage=86400` (1 day)

#### Problems / Risks

> [!WARNING]
> Includes full `years` object in response. For year 2024, this means returning ALL historical project data for every org.

---

### /api/v1/years/:year/stats

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Method | `GET` |
| Route Path | `/api/v1/years/[year]/stats` |
| Access | Public |
| Callers | Year statistics pages |

#### Database Interaction

```prisma
prisma.organizations.findMany({
  where: { active_years: { has: yearNum } },
  select: { slug: true, name: true, category: true, technologies: true, topics: true, stats: true }
})
```

Then aggregates in JavaScript:
- Total projects/students for year
- Category distribution
- Technology distribution
- Topic distribution

#### Performance Characteristics

| Metric | Value |
|--------|-------|
| Typical Response | ~200-500ms |
| Payload Size | ~10KB |

#### Caching Behavior

Year-dependent (same as organizations endpoint).

---

### /api/v1/tech-stack

Similar to `/api/tech-stack` but wrapped in V1 response format.

---

### /api/v1/tech-stack/:slug

Similar to `/api/tech-stack/:slug` but wrapped in V1 response format.

---

## Admin Routes

### /api/admin/compute-first-time

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Methods | `GET`, `POST` |
| Route Path | `/api/admin/compute-first-time` |
| Access | **Authenticated** (x-admin-key header) |
| Purpose | Compute `first_time` field for organizations |

#### Authentication

```
Headers: { "x-admin-key": process.env.ADMIN_KEY }
```

Uses constant-time comparison to prevent timing attacks.

#### POST Behavior

1. Fetches all organizations
2. Sets `first_time = true` where `first_year === targetYear`
3. Updates all organizations one-by-one

#### Performance Characteristics

| Metric | Value |
|--------|-------|
| Typical Response | ~30-60s (updates all orgs) |
| Bottleneck | Sequential updates, no bulk write |

#### Recommendations

1. Use `updateMany` for bulk updates
2. Add progress streaming for long operations

---

### /api/admin/invalidate-cache

#### Route Overview

| Property | Value |
|----------|-------|
| HTTP Methods | `GET`, `POST` |
| Route Path | `/api/admin/invalidate-cache` |
| Access | **Authenticated** (x-admin-key header) |
| Purpose | Manual cache invalidation |

#### POST Request Types

| Type | Body | Effect |
|------|------|--------|
| `all` | `{ "type": "all" }` | Invalidates entire cache |
| `year` | `{ "type": "year", "year": 2025 }` | Invalidates year + related tags |
| `organization` | `{ "type": "organization", "slug": "apache" }` | Invalidates org + path |
| `tags` | `{ "type": "tags", "tags": ["stats"] }` | Invalidates specific tags |
| `path` | `{ "type": "path", "path": "/organizations" }` | Invalidates page path |

#### Caching Behavior

- Response: `Cache-Control: no-store, no-cache, must-revalidate`

---

## Performance Bottlenecks Summary

### Critical Issues 🔴

| Route | Issue | Impact |
|-------|-------|--------|
| `/api/tech-stack/analytics` | Fetches ALL projects for ALL orgs via `years` field | ~50MB data transfer, 1-3s response |
| `/api/v1/years` | Full table scan to aggregate year data | 200-400ms on every request |
| `/api/stats`, `/api/v1/stats` | Full table scan for unique technologies | 300-600ms |
| `/api/tech-stack/:slug` | Double full table scan (variations + orgs) | 200ms-1s |

### Medium Issues 🟡

| Route | Issue | Impact |
|-------|-------|--------|
| `/api/organizations` | Text search with `contains` | Not index-optimized |
| `/api/v1/organizations/:slug` | Returns 100KB+ `years` object | Large payloads |
| `/api/v1/years/:year/organizations` | Includes full `years` in response | Excessive data |

### Minor Issues 🟢

| Route | Issue | Impact |
|-------|-------|--------|
| `/api/projects` | Text search on descriptions | Minor overhead |
| `/api/admin/compute-first-time` | Sequential updates | Slow admin ops |

---

## Recommendations

### High Priority

1. **Precompute aggregations**
   - Create `analytics_cache` collection for tech-stack analytics
   - Create `years_summary` for year listings
   - Create `global_stats` for stats endpoints
   - Update via scheduled job or admin endpoint

2. **Remove `years` from list responses**
   - Organizations list should not include nested project data
   - Create separate endpoint for `/api/v1/organizations/:slug/projects`

3. **Add MongoDB text indexes**
   ```javascript
   db.organizations.createIndex({ name: "text", description: "text" })
   db.projects.createIndex({ project_title: "text", project_abstract_short: "text" })
   ```

### Medium Priority

4. **Add HTTP caching to legacy routes**
   - `/api/organizations`: Add `Cache-Control: s-maxage=300`
   - `/api/projects`: Add `Cache-Control: s-maxage=1800`
   - `/api/stats`: Add `Cache-Control: s-maxage=604800`

5. **Optimize tech variation lookup**
   - Precompute canonical tech names
   - Cache tech name → canonical mapping

6. **Bulk update for admin operations**
   ```prisma
   prisma.organizations.updateMany({
     where: { first_year: targetYear },
     data: { first_time: true }
   })
   ```

### Low Priority

7. **Consider SSG for static pages**
   - Historical year pages can be fully static
   - Organization pages rarely change

8. **Add pagination limits**
   - Cap `limit` at 50 for heavy endpoints
   - Implement cursor-based pagination for deep pages

9. **Monitor query performance**
   - Add timing logs to identify slow queries
   - Use MongoDB profiler for production debugging
