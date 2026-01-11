# GSoC Organizations Public API - Complete Documentation

**Version:** v1.0.0  
**Status:** ✅ Production Ready  
**Date:** December 17, 2025

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Overview](#overview)
3. [Implementation Summary](#implementation-summary)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Pagination Guide](#pagination-guide)
6. [Testing Guide](#testing-guide)
7. [Data Models](#data-models)
8. [Code Examples](#code-examples)
9. [Deployment](#deployment)
10. [Best Practices](#best-practices)

---

# Quick Start

## 🚀 5-Minute Getting Started

### Base URL
```
http://localhost:3000/api/v1
```

### Test the API

```bash
# 1. Check API is running
curl http://localhost:3000/api/v1

# 2. Health check
curl http://localhost:3000/api/v1/health

# 3. Get organizations (first 5)
curl "http://localhost:3000/api/v1/organizations?limit=5"

# 4. Get 2024 statistics
curl http://localhost:3000/api/v1/years/2024/stats

# 5. Search projects
curl "http://localhost:3000/api/v1/projects?q=web&limit=5"
```

### ⚠️ Important: Pagination

**Organizations and Projects are PAGINATED:**
- Default: **20 items per page**
- Maximum: **100 items per page**
- Response includes: `{ total, pages, page, limit }`
- **To get ALL data: Loop through all pages**

### Test Pagination

```bash
node scripts/test-pagination.js
```

---

# Overview

## What is This API?

A comprehensive, read-only REST API providing access to Google Summer of Code (GSoC) organizations, projects, statistics, and historical data from 2016-2025.

## Core Features

✅ **Organizations** - List, search, filter 500+ GSoC organizations  
✅ **Years** - Historical data and statistics by year  
✅ **Projects** - Browse 12,000+ GSoC projects  
✅ **Tech Stack** - Explore technologies and their usage  
✅ **Statistics** - Overall platform insights and analytics  
✅ **Health & Meta** - Monitoring and API documentation  

## Design Principles

### Core Goals ✅

- **Stable & Predictable** - No breaking changes in v1
- **Publicly Accessible** - No authentication required
- **Versioned** - Explicit `/v1` in URL path
- **Fast Reads** - Database indexing + CDN caching
- **Well-Documented** - Complete API reference

### API Philosophy

- **REST-first** - Standard REST conventions
- **Read-only** - Safe for public consumption
- **Cache-friendly** - Long cache times with stale-while-revalidate
- **Explicit versioning** - `/v1`, `/v2` (future)
- **No breaking changes** - Bookmarked endpoints work forever

**Guarantee:** If you bookmark `/api/v1/organizations/mozilla`, it will work 2 years later with the same structure.

---

# Implementation Summary

## What Was Built

### 📁 API Routes Created (12 endpoints)

```
app/api/v1/
├── route.ts                                    # API root
├── health/route.ts                             # Health check
├── meta/route.ts                               # API metadata
├── organizations/
│   ├── route.ts                                # List organizations
│   └── [slug]/route.ts                         # Organization details
├── years/
│   ├── route.ts                                # List years
│   └── [year]/
│       ├── organizations/route.ts              # Orgs by year
│       └── stats/route.ts                      # Year statistics
├── projects/
│   ├── route.ts                                # List projects
│   └── [id]/route.ts                           # Project details
├── tech-stack/
│   ├── route.ts                                # List technologies
│   └── [slug]/route.ts                         # Orgs by technology
└── stats/route.ts                              # Overall statistics
```

### 📚 Documentation Created

- `API_COMPLETE_DOCS.md` - This file (all-in-one reference)
- `scripts/test-pagination.js` - Pagination test script
- `scripts/test-api.sh` - Full API test suite

### 🎯 API Capabilities

**Organizations**
- Paginated listing (default: 20, max: 100 per page)
- Filters: year, technology, category, active status
- Search: name/description
- Sort: name, projects, year
- Full details with year-by-year project data

**Years**
- List all GSoC years (2016-2025)
- Organizations per year with pagination
- Comprehensive statistics per year
- Top categories, technologies, topics

**Projects**
- Paginated listing (default: 20, max: 100 per page)
- Filters: year, organization
- Search: title, abstract, contributor, org
- Full details with mentors and code URLs

**Tech Stack**
- List technologies with usage counts
- Filter by minimum usage
- Search technologies
- Organizations using specific tech (paginated)

**Statistics**
- Overall platform statistics
- Organization counts (total/active/inactive)
- Project and technology counts
- Top categories and technologies
- Year ranges

**Health & Meta**
- Health check with DB connectivity
- Response time monitoring
- Complete API documentation
- Endpoint reference

### 🔧 Technical Stack

- **Framework:** Next.js 16.0.7 API Routes
- **Database:** MongoDB with Prisma ORM
- **Language:** TypeScript
- **Deployment:** Vercel/Railway/Fly.io ready
- **Caching:** CDN-friendly with HTTP cache headers

### ⚡ Performance Optimizations

**Database Indexing:**
- `slug` (unique), `name`, `category`
- `is_currently_active`, `total_projects` (desc)
- `active_years`, `technologies`

**Query Optimization:**
- Selective field projection
- Pagination limits (max 100)
- Aggregation pipelines for stats

**Caching Strategy:**
- Organizations: 1 hour (s-maxage=3600)
- Projects: 30 minutes (s-maxage=1800)
- Stats/Years: 1 hour
- Meta: 24 hours
- Health: No cache

---

# API Endpoints Reference

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // ... response data ...
  },
  "meta": {
    "timestamp": "2025-12-17T14:00:00.000Z",
    "version": "v1"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "organizations": [ /* items */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 504,
      "pages": 26
    }
  },
  "meta": { /* ... */ }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

**Error Codes:**
- `NOT_FOUND` - Resource not found (404)
- `INVALID_YEAR` - Invalid year parameter (400)
- `FETCH_ERROR` - Database error (500)
- `SERVICE_ERROR` - Service unavailable (503)

## Endpoints

### Root & Meta

#### `GET /api/v1`

Welcome message and quick links.

**Response:**
```json
{
  "success": true,
  "message": "Welcome to GSoC Organizations API v1",
  "data": {
    "version": "v1",
    "status": "stable",
    "quick_links": {
      "organizations": "/api/v1/organizations",
      "years": "/api/v1/years",
      "projects": "/api/v1/projects",
      "tech_stack": "/api/v1/tech-stack",
      "stats": "/api/v1/stats"
    }
  }
}
```

#### `GET /api/v1/meta`

Complete API metadata and endpoint documentation.

#### `GET /api/v1/health`

Health check for monitoring.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "response_time_ms": 42,
    "timestamp": "2025-12-17T14:00:00.000Z"
  }
}
```

### Organizations

#### `GET /api/v1/organizations`

List organizations with filters.

**Query Parameters:**

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | number | 1 | ∞ | Page number |
| `limit` | number | 20 | 100 | Items per page |
| `q` | string | - | - | Search name/description |
| `year` | number | - | - | Filter by year |
| `technology` | string | - | - | Filter by technology |
| `category` | string | - | - | Filter by category |
| `active` | boolean | - | - | Filter by active status |
| `sort` | string | name | - | Sort: name, projects, year |

**Example:**
```bash
curl "http://localhost:3000/api/v1/organizations?year=2024&technology=python&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "slug": "mozilla",
        "name": "Mozilla",
        "category": "Web & Open Source",
        "description": "...",
        "image_url": "...",
        "url": "https://mozilla.org",
        "active_years": [2018, 2019, 2020, 2024],
        "first_year": 2018,
        "last_year": 2024,
        "is_currently_active": true,
        "technologies": ["rust", "javascript", "python"],
        "topics": ["web", "browser", "privacy"],
        "total_projects": 42,
        "stats": {
          "avg_projects_per_appeared_year": 10.5,
          "total_students": 40,
          "projects_by_year": { "year_2024": 8 },
          "students_by_year": { "year_2024": 8 }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 504,
      "pages": 51
    }
  }
}
```

#### `GET /api/v1/organizations/{slug}`

Get detailed organization information.

**Example:**
```bash
curl http://localhost:3000/api/v1/organizations/mozilla
```

**Response:** Full organization object with contact, social, years data, and projects.

### Years

#### `GET /api/v1/years`

List all GSoC years with statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "years": [
      {
        "year": 2025,
        "organizations_count": 185,
        "total_projects": 1276,
        "total_students": 1276
      },
      {
        "year": 2024,
        "organizations_count": 195,
        "total_projects": 1127,
        "total_students": 1127
      }
    ],
    "total_years": 10
  }
}
```

#### `GET /api/v1/years/{year}/organizations`

Get organizations that participated in a specific year.

**Path:** `/api/v1/years/2024/organizations`

**Query Parameters:**

| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| `page` | number | 1 | ∞ |
| `limit` | number | 50 | 100 |

**Response:** Paginated list of organizations with year-specific data.

#### `GET /api/v1/years/{year}/stats`

Get comprehensive statistics for a specific year.

**Path:** `/api/v1/years/2024/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "overview": {
      "total_organizations": 195,
      "total_projects": 1127,
      "total_students": 1127,
      "avg_projects_per_org": 5.78
    },
    "categories": [
      { "name": "Web & Open Source", "count": 45 }
    ],
    "technologies": [
      { "name": "Python", "count": 89 }
    ],
    "topics": [
      { "name": "web development", "count": 67 }
    ]
  }
}
```

### Projects

#### `GET /api/v1/projects`

List projects with filters.

**Query Parameters:**

| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| `page` | number | 1 | ∞ |
| `limit` | number | 20 | 100 |
| `q` | string | - | - |
| `year` | number | - | - |
| `org` | string | - | - |

**Example:**
```bash
curl "http://localhost:3000/api/v1/projects?year=2024&org=mozilla&q=web"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "project_id": "...",
        "project_title": "Improve Firefox Rendering",
        "project_abstract_short": "...",
        "project_code_url": "https://github.com/...",
        "contributor": "John Doe",
        "mentors": ["Jane Smith"],
        "org_name": "Mozilla",
        "org_slug": "mozilla",
        "year": 2024,
        "date_created": "2024-03-01T00:00:00.000Z",
        "date_updated": "2024-08-31T00:00:00.000Z"
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

#### `GET /api/v1/projects/{id}`

Get detailed project information.

### Tech Stack

#### `GET /api/v1/tech-stack`

List all technologies with usage counts.

**Query Parameters:**

| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| `limit` | number | 100 | 500 |
| `q` | string | - | - |
| `min_usage` | number | 1 | - |

**Example:**
```bash
curl "http://localhost:3000/api/v1/tech-stack?min_usage=10&limit=20"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "technologies": [
      {
        "name": "Python",
        "slug": "python",
        "usage_count": 245
      },
      {
        "name": "JavaScript",
        "slug": "javascript",
        "usage_count": 198
      }
    ],
    "total": 2
  }
}
```

#### `GET /api/v1/tech-stack/{slug}`

Get organizations using a specific technology.

**Path:** `/api/v1/tech-stack/python`

**Query Parameters:**

| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| `page` | number | 1 | ∞ |
| `limit` | number | 20 | 100 |

### Statistics

#### `GET /api/v1/stats`

Get overall platform statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_organizations": 504,
      "active_organizations": 195,
      "inactive_organizations": 309,
      "total_projects": 12847,
      "total_technologies": 387,
      "total_topics": 1245,
      "total_categories": 15
    },
    "years": {
      "first": 2016,
      "last": 2025,
      "total": 10,
      "range": 10
    },
    "top_categories": [ /* ... */ ],
    "top_technologies": [ /* ... */ ]
  }
}
```

---

# Pagination Guide

## Understanding Pagination

### Why Pagination?

**Performance Benefits:**
- ✅ Faster response times (smaller payloads)
- ✅ Lower bandwidth usage
- ✅ Reduced database load
- ✅ Better user experience (progressive loading)
- ✅ Scalable for thousands of records

### Which Endpoints Are Paginated?

| Endpoint | Paginated? | Default Limit | Max Limit |
|----------|-----------|---------------|-----------|
| `/organizations` | ✅ Yes | 20 | 100 |
| `/organizations/{slug}` | ❌ No | - | - |
| `/years` | ❌ No | - | - |
| `/years/{year}/organizations` | ✅ Yes | 50 | 100 |
| `/years/{year}/stats` | ❌ No | - | - |
| `/projects` | ✅ Yes | 20 | 100 |
| `/projects/{id}` | ❌ No | - | - |
| `/tech-stack` | ❌ No | 100 | 500 |
| `/tech-stack/{slug}` | ✅ Yes | 20 | 100 |
| `/stats` | ❌ No | - | - |

## How Pagination Works

### Default Behavior

```bash
# Without parameters - returns first 20 items
curl http://localhost:3000/api/v1/organizations

# Equivalent to:
curl http://localhost:3000/api/v1/organizations?page=1&limit=20
```

### Response Structure

```json
{
  "data": {
    "organizations": [
      // Array with 20 items (or less if fewer exist)
    ],
    "pagination": {
      "page": 1,           // Current page
      "limit": 20,         // Items per page
      "total": 504,        // Total records in database
      "pages": 26          // Total pages (504 / 20 = 26)
    }
  }
}
```

### What Each Field Means

| Field | Description | Example |
|-------|-------------|---------|
| `page` | Current page number | 1 |
| `limit` | Items per page | 20 |
| `total` | **Total records in entire database** | 504 |
| `pages` | Total pages to fetch all data | 26 |

## Getting All Data

### Example Scenario: 504 Organizations

**Option 1: Maximum Items Per Page (Faster)**

Make 6 requests with `limit=100`:

```bash
curl "http://localhost:3000/api/v1/organizations?page=1&limit=100"  # 1-100
curl "http://localhost:3000/api/v1/organizations?page=2&limit=100"  # 101-200
curl "http://localhost:3000/api/v1/organizations?page=3&limit=100"  # 201-300
curl "http://localhost:3000/api/v1/organizations?page=4&limit=100"  # 301-400
curl "http://localhost:3000/api/v1/organizations?page=5&limit=100"  # 401-500
curl "http://localhost:3000/api/v1/organizations?page=6&limit=100"  # 501-504
```

**Option 2: Default Page Size**

Make 26 requests with `limit=20`:

```bash
curl "http://localhost:3000/api/v1/organizations?page=1"   # 1-20
curl "http://localhost:3000/api/v1/organizations?page=2"   # 21-40
# ... continue for 26 pages
```

## Code Examples

### JavaScript/TypeScript

```typescript
// Fetch all organizations
async function fetchAllOrganizations() {
  let allOrganizations = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `http://localhost:3000/api/v1/organizations?page=${page}&limit=100`
    );
    const data = await response.json();

    if (data.success) {
      allOrganizations.push(...data.data.organizations);
      
      // Check if we've reached the last page
      if (page >= data.data.pagination.pages) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      throw new Error(data.error.message);
    }
  }

  return allOrganizations;
}

// Usage
const allOrgs = await fetchAllOrganizations();
console.log(`Total organizations: ${allOrgs.length}`); // 504
```

### Python

```python
import requests

def fetch_all_organizations():
    all_organizations = []
    page = 1
    base_url = "http://localhost:3000/api/v1"
    
    while True:
        response = requests.get(
            f"{base_url}/organizations",
            params={"page": page, "limit": 100}
        )
        data = response.json()
        
        if data["success"]:
            all_organizations.extend(data["data"]["organizations"])
            
            # Check if there are more pages
            if page >= data["data"]["pagination"]["pages"]:
                break
            else:
                page += 1
        else:
            raise Exception(data["error"]["message"])
    
    return all_organizations

# Usage
all_orgs = fetch_all_organizations()
print(f"Total organizations: {len(all_orgs)}")
```

### React Component (Load More Pattern)

```typescript
const OrganizationsList = () => {
  const [orgs, setOrgs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    
    const response = await fetch(
      `/api/v1/organizations?page=${page}&limit=20`
    );
    const data = await response.json();
    
    if (data.success) {
      setOrgs([...orgs, ...data.data.organizations]);
      setHasMore(page < data.data.pagination.pages);
      setPage(page + 1);
    }
    
    setLoading(false);
  };

  return (
    <div>
      {orgs.map(org => (
        <OrganizationCard key={org.slug} org={org} />
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};
```

## Best Practices

### For API Consumers

1. **Always check pagination metadata**
   ```javascript
   const { total, pages, page } = response.data.pagination;
   console.log(`Showing page ${page} of ${pages} (${total} total)`);
   ```

2. **Use maximum limit for batch downloads**
   ```bash
   # Faster: 6 requests for 504 items
   ?limit=100
   
   # Slower: 26 requests for 504 items
   ?limit=20
   ```

3. **Cache responses client-side**
   - Store in localStorage, IndexedDB, or memory
   - Don't re-fetch pages you already have

4. **Show loading indicators**
   - Let users know data is loading
   - Display "Page X of Y" or "Loading more..."

5. **Handle errors gracefully**
   ```javascript
   if (!data.success) {
     console.error(data.error.message);
     // Show user-friendly error message
   }
   ```

---

# Testing Guide

## Prerequisites

- Dev server running: `pnpm dev`
- Database connected (check `.env` for `DATABASE_URL`)

## Quick Tests

### Test 1: Check Server is Running

```bash
curl http://localhost:3000/api/v1/health
```

Expected output:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "response_time_ms": 42
  }
}
```

### Test 2: Test Pagination

```bash
node scripts/test-pagination.js
```

This shows:
- Total records in your database
- How many pages available
- Sample data from multiple pages

### Test 3: Run Full Test Suite

```bash
bash scripts/test-api.sh
```

Tests all endpoints and validates responses.

## Manual Testing

### Organizations

```bash
# List first 5 organizations
curl "http://localhost:3000/api/v1/organizations?limit=5"

# Search by technology
curl "http://localhost:3000/api/v1/organizations?technology=python&limit=10"

# Filter by year
curl "http://localhost:3000/api/v1/organizations?year=2024&limit=10"

# Get specific organization
curl "http://localhost:3000/api/v1/organizations/mozilla"
```

### Years

```bash
# List all years
curl "http://localhost:3000/api/v1/years"

# Get 2024 organizations
curl "http://localhost:3000/api/v1/years/2024/organizations?limit=10"

# Get 2024 statistics
curl "http://localhost:3000/api/v1/years/2024/stats"
```

### Projects

```bash
# List first 5 projects
curl "http://localhost:3000/api/v1/projects?limit=5"

# Search projects
curl "http://localhost:3000/api/v1/projects?q=web&limit=10"

# Filter by year and org
curl "http://localhost:3000/api/v1/projects?year=2024&org=mozilla&limit=10"
```

### Tech Stack

```bash
# List popular technologies
curl "http://localhost:3000/api/v1/tech-stack?min_usage=10&limit=20"

# Organizations using Python
curl "http://localhost:3000/api/v1/tech-stack/python?limit=10"
```

### Statistics

```bash
# Overall statistics
curl "http://localhost:3000/api/v1/stats"
```

## Troubleshooting

### Issue: "Internal Server Error"

**Cause:** TypeScript compilation error or old cache

**Fix:**
```bash
# Stop server (Ctrl+C)
rm -rf .next
pnpm dev
```

### Issue: "Cannot connect to server"

**Cause:** Server not running

**Fix:**
```bash
pnpm dev
# Wait for: ✓ Ready in ...ms
```

### Issue: Database errors

**Cause:** MongoDB connection issue

**Fix:**
1. Check `.env` file has valid `DATABASE_URL`
2. Verify MongoDB is accessible
3. Check network connection

---

# Data Models

## Organization

```typescript
{
  // Basic Info
  slug: string                    // Unique identifier (e.g., "mozilla")
  name: string                    // Display name
  category: string                // Category (e.g., "Web & Open Source")
  description: string             // Full description
  url: string                     // Organization website
  image_url: string               // Logo URL
  
  // Participation
  active_years: number[]          // Years participated [2018, 2019, 2024]
  first_year: number              // First GSoC year
  last_year: number               // Most recent year
  is_currently_active: boolean    // Active in latest GSoC
  
  // Technology & Topics
  technologies: string[]          // ["python", "javascript", "rust"]
  topics: string[]                // ["web", "browser", "privacy"]
  
  // Statistics
  total_projects: number          // Total projects across all years
  stats: {
    avg_projects_per_appeared_year: number
    total_students: number
    projects_by_year: {
      year_2024?: number
      // ... other years
    }
    students_by_year: {
      year_2024?: number
      // ... other years
    }
  }
  
  // Contact Information
  contact: {
    email?: string
    mailing_list?: string
    irc_channel?: string
    ideas_url?: string
    guide_url?: string
  }
  
  // Social Links
  social: {
    github?: string
    twitter?: string
    blog?: string
    discord?: string
    gitlab?: string
    // ... more platforms
  }
  
  // Year-Specific Data
  years: {
    year_2024?: {
      num_projects: number
      projects_url: string
      projects: Project[]         // Array of project objects
    }
    // ... other years
  }
}
```

## Project

```typescript
{
  project_id: string              // Unique identifier
  project_title: string           // Project title
  project_abstract_short: string  // Short description
  project_info_html: string       // Full description (HTML)
  project_code_url?: string       // GitHub/code repository URL
  
  // People
  contributor: string             // Student name
  mentors: string[]               // Array of mentor names
  
  // Organization
  org_name: string                // Organization name
  org_slug: string                // Organization slug
  
  // Timeline
  year: number                    // GSoC year
  date_created: Date              // Project created date
  date_updated?: Date             // Last updated
  date_archived?: Date            // Archive date (if applicable)
}
```

---

# Code Examples

## Frontend Integration

### Next.js Server Component

```typescript
// app/organizations/page.tsx
export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string }
}) {
  const page = parseInt(searchParams.page || '1');
  const limit = parseInt(searchParams.limit || '20');
  
  const response = await fetch(
    `http://localhost:3000/api/v1/organizations?page=${page}&limit=${limit}`,
    { next: { revalidate: 3600 } } // Cache for 1 hour
  );
  
  const data = await response.json();
  
  if (!data.success) {
    return <div>Error loading organizations</div>;
  }
  
  const { organizations, pagination } = data.data;
  
  return (
    <div>
      <h1>GSoC Organizations</h1>
      <div className="grid">
        {organizations.map(org => (
          <OrganizationCard key={org.slug} org={org} />
        ))}
      </div>
      <Pagination pagination={pagination} />
    </div>
  );
}
```

### React Query Hook

```typescript
import { useQuery } from '@tanstack/react-query';

function useOrganizations(filters: {
  page?: number;
  limit?: number;
  technology?: string;
  year?: number;
}) {
  return useQuery({
    queryKey: ['organizations', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.limit) params.set('limit', filters.limit.toString());
      if (filters.technology) params.set('technology', filters.technology);
      if (filters.year) params.set('year', filters.year.toString());
      
      const response = await fetch(
        `/api/v1/organizations?${params.toString()}`
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error.message);
      }
      
      return data.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Usage
function OrganizationsList() {
  const { data, isLoading, error } = useOrganizations({
    page: 1,
    limit: 20,
    technology: 'python',
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data.organizations.map(org => (
        <div key={org.slug}>{org.name}</div>
      ))}
      <Pagination pagination={data.pagination} />
    </div>
  );
}
```

## Backend Integration

### Node.js Express Proxy

```javascript
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const API_BASE = 'http://localhost:3000/api/v1';

// Proxy endpoint with caching
app.get('/api/organizations', async (req, res) => {
  try {
    const queryString = new URLSearchParams(req.query).toString();
    const response = await fetch(`${API_BASE}/organizations?${queryString}`);
    const data = await response.json();
    
    // Set cache headers
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

app.listen(4000, () => {
  console.log('Proxy server running on port 4000');
});
```

### Python Flask Integration

```python
from flask import Flask, jsonify, request
import requests

app = Flask(__name__)
API_BASE = 'http://localhost:3000/api/v1'

@app.route('/api/organizations')
def get_organizations():
    try:
        # Forward query parameters
        response = requests.get(
            f'{API_BASE}/organizations',
            params=request.args
        )
        data = response.json()
        
        return jsonify(data), response.status_code
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'message': str(e)}
        }), 500

if __name__ == '__main__':
    app.run(port=5000)
```

---

# Deployment

## Environment Variables

```bash
# .env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/gsoc-orgs"
```

## Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Configuration:**
1. Add `DATABASE_URL` in Vercel dashboard
2. Automatic HTTPS and CDN
3. Zero configuration needed

**Your API will be available at:**
```
https://your-project.vercel.app/api/v1
```

## Railway

1. Connect GitHub repository
2. Add environment variable: `DATABASE_URL`
3. Deploy automatically on push
4. Custom domain support

## Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch
fly launch

# Set environment variable
fly secrets set DATABASE_URL="mongodb+srv://..."

# Deploy
fly deploy
```

## Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t gsoc-api .
docker run -p 3000:3000 -e DATABASE_URL="..." gsoc-api
```

## Custom Domain

After deployment, you can use a custom subdomain:

```
https://api.yourdomain.com/v1/organizations
```

Update base URL in documentation from `localhost:3000` to your production domain.

---

# Best Practices

## For API Consumers

### 1. Respect Cache Headers

```javascript
// Good: Let browser/CDN cache
fetch('/api/v1/organizations')

// Avoid: Bypassing cache unnecessarily
fetch('/api/v1/organizations', { cache: 'no-store' })
```

### 2. Use Appropriate Limits

```javascript
// Good: For UI display
?limit=20

// Good: For batch processing
?limit=100

// Avoid: Too small (more requests)
?limit=5
```

### 3. Handle Errors Gracefully

```javascript
async function fetchOrganizations() {
  try {
    const response = await fetch('/api/v1/organizations');
    const data = await response.json();
    
    if (!data.success) {
      // Handle API error
      console.error(data.error.message);
      return { organizations: [], error: data.error };
    }
    
    return { organizations: data.data.organizations };
  } catch (error) {
    // Handle network error
    console.error('Network error:', error);
    return { organizations: [], error: { message: 'Network error' } };
  }
}
```

### 4. Implement Pagination UI

```typescript
// Show page numbers
<Pagination>
  {Array.from({ length: pagination.pages }, (_, i) => (
    <button
      key={i + 1}
      onClick={() => setPage(i + 1)}
      className={page === i + 1 ? 'active' : ''}
    >
      {i + 1}
    </button>
  ))}
</Pagination>

// Or show "Load More"
<button onClick={loadMore} disabled={!hasMore}>
  Load More ({pagination.total - organizations.length} remaining)
</button>
```

### 5. Cache Client-Side

```typescript
// Using React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

// Using localStorage
function getCachedOrganizations() {
  const cached = localStorage.getItem('organizations');
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    // Use cache if less than 1 hour old
    if (age < 1000 * 60 * 60) {
      return data;
    }
  }
  return null;
}
```

## For API Maintainers

### 1. Never Remove Fields in Same Version

```typescript
// ✅ Good: Adding optional fields
interface Organization {
  slug: string
  name: string
  // New field (non-breaking)
  website_status?: 'active' | 'inactive'
}

// ❌ Bad: Removing fields (breaking change)
interface Organization {
  slug: string
  // name: string  <- REMOVED (breaks existing clients)
}
```

### 2. Use Semantic Versioning

- `/v1` - Current stable version
- `/v2` - Future version with breaking changes
- Keep both versions running during transition

### 3. Monitor Performance

```typescript
// Log slow queries
const start = Date.now();
const result = await prisma.organizations.findMany();
const duration = Date.now() - start;

if (duration > 1000) {
  console.warn(`Slow query: ${duration}ms`);
}
```

### 4. Rate Limiting (Future Enhancement)

```typescript
// For future implementation
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: {
      message: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
});

app.use('/api/v1', limiter);
```

---

# Changelog

## v1.0.0 (2025-12-17)

**Initial Release**

✅ **Organizations Endpoints**
- List with pagination, filters, search, sorting
- Detail view with full data including year-by-year projects

✅ **Years Endpoints**
- List all GSoC years with participation stats
- Organizations by year (paginated)
- Comprehensive year statistics

✅ **Projects Endpoints**
- List with pagination, filters, search
- Detail view with full project information

✅ **Tech Stack Endpoints**
- List technologies with usage counts
- Organizations using specific technology (paginated)

✅ **Statistics Endpoint**
- Overall platform statistics
- Organization/project counts
- Top categories and technologies

✅ **Health & Meta Endpoints**
- Health check with database connectivity
- Complete API metadata and documentation

✅ **Performance Optimizations**
- Database indexing
- CDN caching support
- Efficient pagination

✅ **Documentation**
- Complete API reference
- Pagination guide
- Code examples
- Testing guide

---

# Support & Contact

## Issues & Bugs

Report issues on GitHub:
```
https://github.com/yourusername/gsoc-orgs/issues
```

## Feature Requests

Submit feature requests via GitHub Discussions

## Community

- **Discord:** [Your Discord Link]
- **Twitter:** [@YourHandle]
- **Email:** your-email@domain.com

---

# License

This API is provided as-is for public use. Data is sourced from Google Summer of Code public archives.

---

# Acknowledgments

Built with ❤️ for the open-source community.

Data provided by Google Summer of Code program.

Special thanks to all GSoC organizations and contributors.

---

**Last Updated:** December 17, 2025  
**API Version:** v1.0.0  
**Status:** ✅ Production Ready  
**Documentation:** Complete

