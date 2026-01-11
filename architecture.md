# GSoC Organizations Guide — Architecture

> Production-grade, SEO-critical Next.js application for exploring Google Summer of Code organizations.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Data Architecture](#data-architecture)
5. [Caching Architecture](#caching-architecture)
6. [Page Types & Rendering](#page-types--rendering)
7. [API Design](#api-design)
8. [Component Architecture](#component-architecture)
9. [Data Flow](#data-flow)
10. [Performance Considerations](#performance-considerations)
11. [SEO Strategy](#seo-strategy)
12. [Deployment](#deployment)

---

## Overview

The GSoC Organizations Guide is a data-driven platform that helps students explore Google Summer of Code organizations, analyze historical trends, and make informed decisions for their GSoC applications.

### Key Characteristics

| Aspect | Value |
|--------|-------|
| **Traffic Pattern** | Read-heavy (99% reads, 1% writes) |
| **Data Volatility** | Yearly (mostly immutable historical data) |
| **SEO Requirement** | Critical (Google + AI crawlers) |
| **Authentication** | None (fully public) |
| **Personalization** | None (same content for all users) |

---

## Tech Stack

### Core Framework
```
Next.js 16.0.7 (App Router)
React 19.2.0
TypeScript 5.x
```

### Database & ORM
```
MongoDB (via MongoDB Atlas)
Prisma 5.22.0
```

### Styling & UI
```
Tailwind CSS 4.x
Radix UI (primitives)
Framer Motion / Motion (animations)
Lucide React (icons)
Recharts (data visualization)
```

### Infrastructure
```
Vercel (hosting + CDN)
Cloudflare R2 (image storage)
Vercel Analytics
```

### Development Tools
```
pnpm (package manager)
ESLint 9.x
Husky + lint-staged (pre-commit hooks)
Commitlint (commit message validation)
```

---

## Project Structure

```
gsoc-orgs/
├── app/                          # Next.js App Router
│   ├── [slug]/                   # Year pages (/gsoc-2024-organizations)
│   ├── about/
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin endpoints
│   │   ├── organizations/
│   │   ├── projects/
│   │   ├── stats/
│   │   ├── tech-stack/
│   │   └── v1/                   # Versioned public API
│   ├── contact/
│   ├── organizations/            # Organization pages
│   │   └── [slug]/               # Organization detail
│   ├── privacy-policy/
│   ├── tech-stack/
│   │   └── [stack]/
│   ├── terms-and-conditions/
│   ├── topics/
│   │   └── [topic]/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   └── sitemap.ts                # Dynamic sitemap
│
├── components/                   # Shared components
│   ├── ui/                       # Base UI components
│   └── icons/                    # Icon components
│
├── lib/                          # Utilities & helpers
│   ├── cache.ts                  # Caching utilities
│   ├── db.cached.ts              # Cached Prisma queries
│   ├── prisma.ts                 # Prisma client
│   ├── api.ts                    # Client-side API helpers
│   ├── api.server.ts             # Server-side API helpers
│   ├── constants.ts              # App constants
│   └── utils.ts                  # General utilities
│
├── hooks/                        # Custom React hooks
│
├── prisma/
│   └── schema.prisma             # Database schema
│
├── public/                       # Static assets
│
├── docs/                         # Documentation
│   └── CACHING_ARCHITECTURE.md
│
├── ai-mds/                       # AI change logs
│
├── scripts/                      # Build/utility scripts
│
└── [config files]                # Various configs
```

---

## Data Architecture

### Database Schema (MongoDB via Prisma)

```
┌─────────────────────────────────────────────────────────────┐
│                      organizations                          │
├─────────────────────────────────────────────────────────────┤
│ id (ObjectId)          │ Primary key                        │
│ slug (String, unique)  │ URL identifier                     │
│ name (String)          │ Organization name                  │
│ description (String)   │ Full description                   │
│ category (String)      │ e.g., "Web", "AI/ML"              │
│ technologies (String[])│ Tech stack                         │
│ topics (String[])      │ Domain areas                       │
│ active_years (Int[])   │ Years participated                 │
│ first_year (Int)       │ First GSoC year                    │
│ last_year (Int)        │ Most recent year                   │
│ total_projects (Int)   │ All-time project count             │
│ stats (Object)         │ Aggregated statistics              │
│ years (Object)         │ Year-by-year project data          │
│ social (Object)        │ Social media links                 │
│ contact (Object)       │ Contact information                │
│ ...                    │                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        projects                             │
├─────────────────────────────────────────────────────────────┤
│ id (ObjectId)          │ Primary key                        │
│ project_id (String)    │ Unique project identifier          │
│ project_title (String) │ Project name                       │
│ org_slug (String)      │ Parent organization                │
│ year (Int)             │ GSoC year                          │
│ contributor (String)   │ Student name                       │
│ mentors (String[])     │ Mentor names                       │
│ ...                    │                                    │
└─────────────────────────────────────────────────────────────┘
```

### Data Characteristics

| Collection | Count | Volatility | Cache Strategy |
|------------|-------|------------|----------------|
| organizations | ~500+ | Yearly | Long (30 days) |
| projects | ~10,000+ | Yearly | Long (30 days) |
| Historical data | - | Never | Immutable (1 year) |

---

## Caching Architecture

### Four-Layer Caching

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST FLOW                             │
└─────────────────────────────────────────────────────────────┘

                         ┌──────────────┐
                         │    Client    │
                         └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │  Vercel CDN  │  ◄── Layer 1: Edge (Cache-Control)
                         └──────┬───────┘
                                │ MISS
                         ┌──────▼───────┐
                         │   Next.js    │  ◄── Layer 2: ISR (revalidate)
                         │     ISR      │
                         └──────┬───────┘
                                │ MISS
                         ┌──────▼───────┐
                         │unstable_cache│  ◄── Layer 3: Data Cache
                         └──────┬───────┘
                                │ MISS
                         ┌──────▼───────┐
                         │   MongoDB    │  ◄── Layer 4: Database
                         └──────────────┘
```

### Cache Durations

| Data Type | Duration | Reason |
|-----------|----------|--------|
| Historical years | 1 year | Immutable |
| Current year | 1 day | May update |
| Organization details | 30 days | Yearly changes |
| Static pages | 30 days | Rarely changes |
| Global stats | 7 days | Aggregated |
| Search results | 1 hour | Query-dependent |

### Tag-Based Invalidation

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
│   └── tech-stack:{slug}
└── topics
    └── topic:{slug}
```

### Cache Invalidation Endpoint

```
POST /api/admin/invalidate-cache
Headers: x-admin-key: YOUR_ADMIN_KEY

Body options:
- { "type": "all" }
- { "type": "year", "year": 2026 }
- { "type": "organization", "slug": "apache" }
- { "type": "tags", "tags": ["stats"] }
- { "type": "path", "path": "/organizations" }
```

---

## Page Types & Rendering

### Rendering Strategy by Route

| Route | Type | ISR Period | Notes |
|-------|------|------------|-------|
| `/` | Static + ISR | 1 day | Homepage with trending |
| `/about` | Static | 30 days | Content page |
| `/organizations` | Dynamic + ISR | 1 hour | Search/filter |
| `/organizations/[slug]` | Static + ISR | 30 days | Org detail |
| `/gsoc-[year]-organizations` | Dynamic | 1 day | Year pages |
| `/tech-stack/[stack]` | Dynamic + ISR | 7 days | Tech filtering |
| `/topics/[topic]` | Dynamic + ISR | 7 days | Topic filtering |
| `/api/*` | Dynamic | - | API routes |

### Page Configuration Pattern

```typescript
// Static page with long ISR
export const revalidate = 2592000; // 30 days

// Dynamic page with ISR
export const revalidate = 86400; // 1 day

// Search/filter page
export const revalidate = 3600; // 1 hour
```

---

## API Design

### API Versioning

```
/api/               # Internal APIs (used by pages)
/api/v1/            # Public versioned API
```

### Public API Endpoints (v1)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/organizations` | GET | List organizations |
| `/api/v1/organizations/[slug]` | GET | Organization detail |
| `/api/v1/projects` | GET | List projects |
| `/api/v1/projects/[id]` | GET | Project detail |
| `/api/v1/years` | GET | Available years |
| `/api/v1/years/[year]/organizations` | GET | Orgs by year |
| `/api/v1/years/[year]/stats` | GET | Year statistics |
| `/api/v1/stats` | GET | Global statistics |
| `/api/v1/tech-stack` | GET | Tech stack list |
| `/api/v1/meta` | GET | Platform metadata |
| `/api/v1/health` | GET | Health check |

### Response Format

```typescript
// Success
{
  success: true,
  data: { ... },
  meta: {
    timestamp: "2026-01-12T...",
    version: "v1",
    cached: true,
    cache_ttl: "30 days"
  }
}

// Error
{
  success: false,
  error: {
    message: "Error description",
    code: "ERROR_CODE"
  }
}
```

### Cache-Control Headers

```typescript
// Historical data (immutable)
'Cache-Control': 'public, s-maxage=31536000, stale-while-revalidate=604800'

// Long-lived data
'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=604800'

// Medium-lived data
'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400'

// Short-lived data
'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
```

---

## Component Architecture

### Component Hierarchy

```
app/
└── layout.tsx                    # Root layout (fonts, analytics)
    └── page.tsx                  # Page component
        └── Container             # Width constraint
            └── SectionHeader     # Page sections
                └── Grid          # Layout grid
                    └── Card      # Content cards
```

### Shared Components (`/components`)

| Component | Purpose |
|-----------|---------|
| `Button` | Action buttons (variants) |
| `Badge` | Labels and tags |
| `Card` / `CardWrapper` | Content containers |
| `Container` | Page width constraint |
| `Grid` | Responsive grid layout |
| `SectionHeader` | Section titles |
| `OrganizationCard` | Org listing card |
| `ProjectCard` | Project listing card |
| `Footer` | Page footer |
| `Header` | Navigation header |

### Component Rules

1. **Reuse before creating** - Check existing components first
2. **Extend via props** - Add variants, not duplicates
3. **Server Components by default** - Client only when needed
4. **Consistent styling** - Use design tokens

---

## Data Flow

### Server Component Data Flow

```
┌─────────────────┐
│  Page.tsx       │  (Server Component)
│  generateMetadata
│  async function │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ lib/db.cached.ts│  (Cached Prisma Queries)
│ unstable_cache  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ lib/prisma.ts   │  (Prisma Client)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    MongoDB      │
└─────────────────┘
```

### Client Component Data Flow

```
┌─────────────────┐
│ Client Component│
│ (interactivity) │
└────────┬────────┘
         │ fetch()
         ▼
┌─────────────────┐
│  /api/v1/...    │  (API Routes)
│  Cache-Control  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    CDN Cache    │  (Vercel Edge)
└─────────────────┘
```

---

## Performance Considerations

### Goals

| Metric | Target |
|--------|--------|
| TTFB | < 200ms (cached) |
| LCP | < 2.5s |
| DB queries per page | 0 (cached) |
| Build time | < 5 min |

### Optimization Strategies

1. **Aggressive Caching**
   - Historical data: 1 year TTL
   - Current data: 1-30 day TTL
   - Tag-based invalidation for updates

2. **Static Generation**
   - Pre-render static pages at build
   - ISR for dynamic content

3. **Image Optimization**
   - Images served from Cloudflare R2
   - Next.js Image with lazy loading

4. **Code Splitting**
   - Automatic by Next.js
   - Dynamic imports for heavy components

5. **Database Efficiency**
   - Cached Prisma queries
   - Indexed fields for common queries
   - Select only needed fields

---

## SEO Strategy

### Technical SEO

| Feature | Implementation |
|---------|---------------|
| Server Rendering | All pages SSR/SSG |
| Metadata | `generateMetadata` per page |
| Sitemap | Dynamic `/sitemap.xml` |
| Robots | `/robots.txt` |
| Canonical URLs | Explicit per page |
| Open Graph | Full OG tags |
| Twitter Cards | Summary large image |

### URL Structure

```
/                                    # Homepage
/organizations                       # All orgs
/organizations/{slug}                # Org detail
/organizations/{slug}/projects/{id}  # Project detail
/gsoc-{year}-organizations           # Year listing
/tech-stack                          # All tech
/tech-stack/{slug}                   # Tech detail
/topics                              # All topics
/topics/{slug}                       # Topic detail
```

### Metadata Pattern

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const data = await getCachedData(params.slug); // Must be cached!
  
  return {
    title: `${data.name} - GSoC Organizations Guide`,
    description: data.description,
    alternates: {
      canonical: getFullUrl(`/path/${params.slug}`),
    },
    openGraph: { ... },
    twitter: { ... },
  };
}
```

---

## Deployment

### Platform: Vercel

```
Production: https://www.gsocorganizationsguide.com
Preview: Auto-deployed per PR
```

### Environment Variables

```bash
# Required
DATABASE_URL=mongodb+srv://...
NEXT_PUBLIC_SITE_URL=https://www.gsocorganizationsguide.com
ADMIN_KEY=your-secret-admin-key

# Optional
# (add as needed)
```

### Build Pipeline

```
1. pnpm install
2. prisma generate
3. pnpm build
4. Deploy to Vercel
```

### Pre-commit Hooks

```
- ESLint (auto-fix)
- TypeScript check
- Build validation
- Commitlint
```

### Cache Invalidation Workflow

```bash
# When new GSoC year data is added:
1. Upload data to MongoDB
2. POST /api/admin/invalidate-cache { "type": "year", "year": 2026 }
3. (Optional) POST /api/admin/invalidate-cache { "type": "all" }
```

---

## Quick Reference

### Common Commands

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # Run linter
pnpm type-check   # TypeScript check
pnpm validate     # Full validation
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/cache.ts` | Caching utilities |
| `lib/db.cached.ts` | Cached database queries |
| `lib/prisma.ts` | Database client |
| `.cursorrules` | AI coding rules |
| `docs/CACHING_ARCHITECTURE.md` | Caching docs |

### DO NOT

- Use `cache: "no-store"` on SEO pages
- Fetch uncached data in `generateMetadata`
- Create duplicate components
- Introduce new design patterns
- Skip the `/ai-mds/` changelog

---

*Last updated: January 2026*
