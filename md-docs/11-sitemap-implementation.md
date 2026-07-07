# Sitemap Implementation & Maintenance Guide

## Overview

The sitemap (`app/sitemap.ts`) is a Next.js dynamic sitemap that automatically generates XML sitemap entries for all indexable pages on the site. It's accessible at `/sitemap.xml` and helps search engines discover and index all pages.

## How It Works

### Architecture

The sitemap uses Next.js's `MetadataRoute.Sitemap` API, which:
- **Currently generated at build time** (no `revalidate` configured - pure static generation)
- **Note:** If you add `export const revalidate = X` to this file, it becomes ISR instead of build-only
- Automatically generates `/sitemap.xml` route
- Updates when you rebuild the application
- Includes proper SEO metadata (priority, changeFrequency, lastModified)

### Data Sources

The sitemap fetches data from multiple sources in parallel:

1. **Database (Prisma)**
   - Organization slugs: `prisma.organizations.findMany()`
   - Tech stack slugs: Extracted from `organizations.technologies[]`
   - Project IDs: `prisma.projects.findMany()` with distinct project IDs

2. **Static JSON Files**
   - Topics: Loaded from `new-api-details/topics/index.json`
   - Project years: From `getAvailableProjectYears()` helper

3. **Hardcoded Routes**
   - Static pages: Homepage, About, Contact, Privacy, Terms, etc.
   - Index pages: `/organizations`, `/tech-stack`, `/topics`, `/projects`, `/yearly`, `/blog`

### Route Categories

The sitemap includes all routes organized by priority:

#### Priority 1.0 (Highest)
- Homepage (`/`)

#### Priority 0.9 (High)
- `/organizations` (index page)
- `/organizations/[slug]` (all organization detail pages)

#### Priority 0.85 (High)
- `/tech-stack/[stack]` (all tech stack detail pages)
- `/topics/[topic]` (all topic detail pages)

#### Priority 0.8 (Medium-High)
- Static pages: `/about`, `/contact`, `/privacy-policy`, `/terms-and-conditions`
- Index pages: `/tech-stack`, `/topics`, `/projects`, `/yearly`, `/blog`
- `/yearly/google-summer-of-code-YYYY` (yearly pages, 2016 to last completed year)

#### Priority 0.75 (Medium)
- `/projects/[year]` (project pages by year, 2016-2025)

#### Priority 0.6 (Lower)
- `/organizations/[slug]/projects/[projectId]` (individual project detail pages)
  - Deprioritized to preserve crawl budget for higher-value pages
  - 10,000+ URLs can dilute crawl budget if prioritized too high

### Change Frequency

- `daily`: Homepage (most dynamic)
- `weekly`: Organization pages, tech stack, topics, static pages
- `monthly`: Project detail pages
- `yearly`: Year pages, project year pages (historical data)

### Last Modified Dates

**Current Implementation:**
- All pages use `new Date()` (current build time)
- This tells search engines everything changed "today" on every build
- Not incorrect, but less useful for crawlers than actual modification dates

**Future Improvement:**
- Use actual `date_updated` from database for organizations/projects
- Use file modification times for static JSON data
- More accurate lastmod helps crawlers prioritize what to re-crawl

## Implementation Details

### Parallel Data Fetching

All data sources are fetched in parallel using `Promise.all()` for optimal performance:

```typescript
const [orgSlugs, techSlugs, topicSlugs, projectIds] = await Promise.all([
  getAllOrganizationSlugs(),
  getAllTechStackSlugs(),
  getAllTopicSlugs(),
  getAllProjectIds(),
])
```

### Error Handling

Each data fetching function:
- Uses try-catch blocks
- Returns empty arrays on error (prevents sitemap generation failure)
- Logs errors in development mode only
- Gracefully degrades (e.g., topics fallback to hardcoded list)

### Base URL Validation

The sitemap ensures proper URL formatting:
- Removes trailing slashes from `SITE_URL`
- Forces https protocol (replaces http if present)
- Falls back to production URL if `NEXT_PUBLIC_SITE_URL` not set
- **Important:** Ensure `NEXT_PUBLIC_SITE_URL` is set in all environments (dev, staging, production)
- **Format:** Should be `https://www.gsocorganizationsguide.com` (no trailing slash)

### Robots.txt Integration

The sitemap is already referenced in `public/robots.txt`:
```
Sitemap: https://www.gsocorganizationsguide.com/sitemap.xml
```

This ensures search engines can discover the sitemap automatically. No additional configuration needed.

### Dynamic Route Generation

**Yearly Pages:**
- Generated for years 2016 to `currentYear - 1`
- Format: `/yearly/google-summer-of-code-YYYY`
- Only includes completed GSoC years

**Project Year Pages:**
- Generated for all available project years (2016-2025)
- Format: `/projects/YYYY`
- Uses `getAvailableProjectYears()` helper

**Project Detail Pages:**
- Generated from database `projects` table
- Format: `/organizations/[org_slug]/projects/[project_id]`
- Uses `distinct` to avoid duplicates

## How to Update the Sitemap

### Automatic Updates

The sitemap **automatically updates** when you:

1. **Rebuild the application** (`npm run build`)
   - New organizations → automatically included
   - New tech stacks → automatically included
   - New projects → automatically included
   - New topics → automatically included (if JSON updated)

2. **Add new static pages**
   - Add route to `staticRoutes` array in `app/sitemap.ts`

3. **Add new year data**
   - Yearly pages: Automatically included if year is ≤ `currentYear - 1`
   - Project year pages: Add year to `getAvailableProjectYears()` in `lib/projects-page-types.ts`

### Manual Updates Required

You need to manually update the sitemap in these cases:

#### 1. Adding a New Static Route

```typescript
const staticRoutes = [
  '',
  '/about',
  '/contact',
  // ... existing routes
  '/your-new-page', // Add here
]
```

#### 2. Changing Year Range

**For yearly pages:**
```typescript
// Current: 2016 to lastCompletedYear
// To change start year, modify the loop:
for (let year = 2016; year <= lastCompletedYear; year++) {
  // Change 2016 to your desired start year
}
```

**For project year pages:**
Update `getAvailableProjectYears()` in `lib/projects-page-types.ts`:
```typescript
export function getAvailableProjectYears(): number[] {
  return [2016, 2017, ..., 2025, 2026]; // Add new year
}
```

#### 3. Changing Priority or Change Frequency

Modify the mapping functions:
```typescript
// Example: Increase organization page priority
...orgSlugs.map((slug) => ({
  url: `${baseUrl}/organizations/${slug}`,
  lastModified: new Date(),
  changeFrequency: 'weekly' as const,
  priority: 0.95, // Changed from 0.9
})),
```

### When New Data is Added

**New Organizations:**
- ✅ Automatically included (fetched from database)
- No action needed

**New Tech Stacks:**
- ✅ Automatically included (extracted from organizations)
- No action needed

**New Topics:**
- ✅ Automatically included if `topics/index.json` is updated
- Falls back to hardcoded list if JSON unavailable

**New Projects:**
- ✅ Automatically included (fetched from database)
- No action needed

**New Years:**
- Yearly pages: Automatically included when year completes (becomes `currentYear - 1`)
- Project year pages: Add to `getAvailableProjectYears()` array

## Testing the Sitemap

### Local Testing

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the server:**
   ```bash
   npm run start
   ```

3. **Visit the sitemap:**
   ```
   http://localhost:3000/sitemap.xml
   ```

4. **Verify routes:**
   - Check that all expected routes are present
   - Verify priorities and change frequencies
   - Ensure URLs are correct

### Production Verification

1. **Deploy to production**
2. **Visit:** `https://www.gsocorganizationsguide.com/sitemap.xml`
3. **Submit to Google Search Console:**
   - Go to Sitemaps section
   - Submit `/sitemap.xml`
   - Monitor for errors

## Performance Considerations

### Build Time Impact

- **Database queries:** Run once at build time (cached by Next.js)
- **Parallel fetching:** All queries run simultaneously (fast)
- **Sitemap size:** Can be large (1000s of URLs) but Next.js handles it efficiently

### Optimization Tips

1. **Limit project detail pages** (if too many):
   ```typescript
   // Only include recent projects
   const recentProjects = projectIds.filter(/* filter logic */)
   ```

2. **Use ISR for sitemap** (if needed):
   - Currently regenerates on every build
   - Can add `revalidate` if you want periodic updates

3. **Split into multiple sitemaps** (if >50k URLs):
   - Next.js supports sitemap index files
   - Split by category (orgs, projects, etc.)

## Current Sitemap Contents

### Static Routes (11)
**Note:** "Static routes" here means top-level pages explicitly listed (excluding dynamic children like `/organizations/[slug]`).

- `/` (homepage)
- `/about`
- `/contact`
- `/privacy-policy`
- `/terms-and-conditions`
- `/organizations` (index page - dynamic children listed separately)
- `/tech-stack` (index page - dynamic children listed separately)
- `/topics` (index page - dynamic children listed separately)
- `/projects` (index page - dynamic children listed separately)
- `/yearly` (index page - dynamic children listed separately)
- `/blog`

### Dynamic Routes
- **Organizations:** ~700+ pages (`/organizations/[slug]`)
- **Tech Stack:** ~800+ pages (`/tech-stack/[stack]`)
- **Topics:** ~150+ pages (`/topics/[topic]`)
- **Yearly Pages:** 9 pages (`/yearly/google-summer-of-code-YYYY`, 2016-2024)
- **Project Year Pages:** 10 pages (`/projects/YYYY`, 2016-2025)
- **Project Detail Pages:** ~10,000+ pages (`/organizations/[slug]/projects/[projectId]`)

**Total:** ~12,000+ URLs in sitemap

## Maintenance Checklist

When adding new features:

- [ ] Add new static routes to `staticRoutes` array
- [ ] Update year ranges if needed
- [ ] Verify new dynamic routes are automatically included
- [ ] Test sitemap after build
- [ ] Submit updated sitemap to Google Search Console
- [ ] Verify `NEXT_PUBLIC_SITE_URL` is set in all environments
- [ ] Ensure `/sitemap.xml` is referenced in `robots.txt` (already done ✅)

## Troubleshooting

### Sitemap Not Updating

1. **Check build logs:** Look for errors in sitemap generation
2. **Verify database connection:** Ensure Prisma can connect
3. **Check JSON files:** Ensure topics index JSON exists
4. **Clear Next.js cache:** Delete `.next` folder and rebuild

### Missing Routes

1. **Check data sources:** Verify database has the data
2. **Check helper functions:** Ensure `getAvailableProjectYears()` includes all years
3. **Verify route exists:** Check that the page file exists in `app/` directory

### Performance Issues

1. **Too many URLs:** Consider filtering or splitting sitemap
2. **Slow database queries:** Add indexes to Prisma schema
3. **Build timeouts:** Optimize queries or use pagination

## Future Improvements

Potential enhancements:

1. **Sitemap Index:** Split into multiple sitemaps if URLs exceed ~40k (Google limit is 50k per sitemap)
   - Current: ~12k URLs (safe)
   - Trigger: If URLs exceed ~40k, implement sitemap index
   - Split by category: `sitemap-orgs.xml`, `sitemap-projects.xml`, etc.

2. **Last Modified Dates:** Use actual `date_updated` from database
   - Organizations: Use `date_updated` from `organizations` table
   - Projects: Use `date_updated` from `projects` table
   - Static JSON: Use file modification times
   - More accurate lastmod helps crawlers prioritize re-crawling

3. **Priority Calculation:** Dynamic priorities based on page importance
   - Factor in organization size, project count, year recency
   - Currently uses fixed priorities (simpler, but less nuanced)

4. **Image Sitemaps:** Add image URLs for better image SEO
   - Include organization logos, project screenshots
   - Helps Google index images better

5. **News Sitemaps:** If blog is added, include news sitemap
   - Separate sitemap for blog articles
   - Helps with Google News indexing

---

## Summary for AI/Developers

**How it works:**
- Next.js dynamic sitemap (`app/sitemap.ts`)
- Fetches data from database (organizations, tech stacks, projects) and static JSON (topics)
- Generates XML at build time
- Includes all indexable pages with proper SEO metadata

**How to update:**
- **Automatic:** Most routes update automatically when data changes
- **Manual:** Add static routes to `staticRoutes` array
- **Years:** Update `getAvailableProjectYears()` for project year pages

**When it updates:**
- Every build (`npm run build`)
- Automatically includes new organizations, tech stacks, projects, topics
- Yearly pages auto-include when year completes

**Key files:**
- `app/sitemap.ts` - Main sitemap implementation
- `lib/topics-page-types.ts` - Topics data loader
- `lib/projects-page-types.ts` - Project years helper
