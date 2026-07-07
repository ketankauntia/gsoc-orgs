# GSoC Organizations Guide - Data Architecture

This document explains how GSoC organization data is stored, fetched, and calculated across the application.

---

## 1. Data Source & Storage

### Primary Database: MongoDB + Prisma

All data is stored in MongoDB and accessed via Prisma ORM. The main collection is `organizations`.

### Key Fields in `organizations` Collection

| Field | Type | Description |
|-------|------|-------------|
| `slug` | String (unique) | URL-friendly organization identifier |
| `name` | String | Organization display name |
| `category` | String | Organization category (e.g., "Science and medicine") |
| `technologies` | String[] | List of technologies/languages used |
| `topics` | String[] | List of topics/domains |
| `first_year` | Int | **The first GSoC year this org ever participated** |
| `active_years` | Int[] | Array of all years the org participated |
| `years` | Object | Nested object with year-specific data |
| `stats` | Object | Aggregated statistics |

### The `years` Object Structure

```json
{
  "year_2016": {
    "num_projects": 5,
    "projects": [{ ... }]
  },
  "year_2017": {
    "num_projects": 3,
    "projects": [{ ... }]
  },
  ...
}
```

Each year key contains:
- `num_projects`: Number of projects accepted that year
- `projects`: Array of project details

---

## 2. Key Metrics & How They're Calculated

### 2.1 First-Time Organizations (New Orgs)

**Definition**: Organizations appearing in GSoC for the **very first time** in a specific year.

**Calculation Method**:
```typescript
// For a specific year page (e.g., /gsoc-2025-organizations)
const newOrgs = organizations.filter(
  (org) => org.first_year === targetYear
).length;
```

**Key Field**: `first_year` (immutable - set once when org first appears)

**Example**:
- If `org.first_year = 2020`, the org is "first-time" only for GSoC 2020
- On `/gsoc-2020-organizations`, this org counts as "New"
- On `/gsoc-2021-organizations`, this org counts as "Returning"

### 2.2 Returning Organizations (Veterans)

**Definition**: Organizations that have participated in previous GSoC editions.

**Calculation**:
```typescript
const returningOrgs = totalOrgs - newOrgs;
```

### 2.3 Total Organizations per Year

**Definition**: Count of all organizations that participated in a specific year.

**Source**: Count of organizations where `active_years` array contains the target year.

```typescript
// API query
const where = { active_years: { has: yearNum } };
const total = await prisma.organizations.count({ where });
```

### 2.4 Total Projects per Year

**Source**: Summed from each organization's `years.year_YYYY.num_projects`

```typescript
const totalProjects = organizations.reduce((sum, org) => {
  const yearData = org.years[`year_${year}`];
  return sum + (yearData?.num_projects || 0);
}, 0);
```

---

## 3. API Endpoints

### 3.1 Year-Specific Organizations

**Endpoint**: `GET /api/v1/years/{year}/organizations`

**Returns**: All organizations that participated in a specific year with full details including `first_year`.

**Used By**: Year pages (`/gsoc-YYYY-organizations`)

**Example Response**:
```json
{
  "success": true,
  "data": {
    "year": 2025,
    "organizations": [
      {
        "slug": "org-name",
        "name": "Org Name",
        "first_year": 2020,
        "active_years": [2020, 2021, 2022, 2025],
        ...
      }
    ],
    "pagination": { "page": 1, "limit": 100, "total": 185 }
  }
}
```

### 3.2 Year Statistics

**Endpoint**: `GET /api/v1/years/{year}/stats`

**Returns**: Aggregated statistics for a year including:
- `total_organizations`
- `total_projects`
- `total_students`
- Top technologies and topics

### 3.3 Filtered Organizations

**Endpoint**: `GET /api/organizations`

**Query Parameters**:
| Parameter | Description |
|-----------|-------------|
| `years` | Filter by specific years (comma-separated) |
| `firstTimeOnly` | If `true`, returns only first-time orgs |
| `technologies` | Filter by tech stack |
| `topics` | Filter by topics |
| `categories` | Filter by category |

**First-Time Filter Logic**:
```typescript
if (firstTimeOnly) {
  if (years.length > 0) {
    // Org is first-time if first_year matches any selected year
    whereConditions.push({
      OR: years.map((y) => ({ first_year: y })),
    });
  } else {
    // Use computed first_time boolean field
    whereConditions.push({ first_time: true });
  }
}
```

---

## 4. Data Flow: Year Page Example

When a user visits `/gsoc-2025-organizations`:

```
1. Page Server Component loads
   ↓
2. fetchOrganizationsByYear("2025") is called
   ↓
3. API: GET /api/v1/years/2025/organizations?limit=100&page=1
   ↓
4. API: GET /api/v1/years/2025/organizations?limit=100&page=2 (if needed)
   ↓
5. All orgs are collected with their actual first_year values
   ↓
6. Metrics are calculated:
   - Total Orgs: all orgs returned
   - New Orgs: orgs where first_year === 2025
   - Veterans: Total - New
   - Projects: sum of num_projects for 2025
```

---

## 5. The `first_time` Boolean Field (Optional)

### Purpose

There's also an optional computed `first_time` boolean field on organizations:
- Set by admin endpoint: `POST /api/admin/compute-first-time`
- Used for global "first-time" filter when no specific year is selected

### When It's Used

- `/organizations?firstTimeOnly=true` (without year filter) → uses `first_time` field
- `/organizations?years=2025&firstTimeOnly=true` → uses `first_year === 2025`

### Important Note

The `first_time` boolean is computed for a **target year** (usually current year) and is separate from the immutable `first_year` field.

---

## 6. Static Generation & Caching

### ISR (Incremental Static Regeneration)

- Year pages use ISR with 1-day revalidation
- Historical years (2+ years old) are cached for 1 year
- Current/upcoming years are cached for 1 day

### Data is NOT Dynamic

All metrics shown on year pages are **pre-calculated at build/regeneration time**:
- No client-side API calls for metrics
- Data is server-rendered
- Metrics are consistent across page views

### Cache Invalidation

- Manual: `POST /api/admin/invalidate-cache`
- Automatic: ISR revalidation after configured period

---

## 7. Summary: Which Field Controls What

| Metric | Source Field | Mutable? |
|--------|--------------|----------|
| Org's First GSoC Year | `first_year` | No (set once) |
| Years Participated | `active_years[]` | No |
| Is "New" for Year X | `first_year === X` | No |
| Projects per Year | `years.year_X.num_projects` | No |
| Global First-Time Flag | `first_time` | Yes (computed) |

---

## 8. Verified Metrics (2016-2025)

| Year | Total Orgs | First-Time | Returning |
|------|------------|------------|-----------|
| 2016 | 178 | 178 (100%) | 0 |
| 2017 | 201 | 71 (35%) | 130 |
| 2018 | 212 | 49 (23%) | 163 |
| 2019 | 206 | 31 (15%) | 175 |
| 2020 | 199 | 33 (17%) | 166 |
| 2021 | 202 | 41 (20%) | 161 |
| 2022 | 203 | 34 (17%) | 169 |
| 2023 | 171 | 19 (11%) | 152 |
| 2024 | 195 | 34 (17%) | 161 |
| 2025 | 185 | 14 (8%) | 171 |

---

## 9. Code References

- **Year Page**: `app/[slug]/page.tsx` → `fetchOrganizationsByYear()`
- **Year API**: `app/api/v1/years/[year]/organizations/route.ts`
- **Orgs API**: `app/api/organizations/route.ts`
- **Prisma Schema**: `prisma/schema.prisma` → `organizations` model
- **Admin Compute**: `app/api/admin/compute-first-time/route.ts`
