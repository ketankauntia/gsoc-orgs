/**
 * GSoC Organizations Guide - Production-Grade Caching System
 *
 * This module provides a centralized caching layer optimized for:
 * - Near-static, yearly-updated GSoC data
 * - SEO-critical server-rendered pages
 * - Vercel + Next.js App Router best practices
 * - Prisma + MongoDB read-heavy workloads
 *
 * Architecture:
 * - Uses Next.js `unstable_cache` for data-level caching
 * - Tag-based invalidation for surgical cache busting
 * - Year-based cache segmentation (historical vs current)
 * - Long TTLs for immutable historical data
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/unstable_cache
 */

import { unstable_cache } from "next/cache";

// =============================================================================
// CACHE TAGS - Hierarchical tag system for surgical invalidation
// =============================================================================

/**
 * Cache tag constants for tag-based revalidation.
 *
 * Tag Hierarchy:
 * - `all` → Invalidates entire cache (use sparingly)
 * - `organizations` → All organization data
 * - `organization:{slug}` → Specific organization
 * - `year:{year}` → All data for a specific year
 * - `stats` → Global statistics
 * - `tech-stack` → Tech stack aggregations
 * - `topics` → Topic aggregations
 * - `projects` → All projects
 * - `project:{id}` → Specific project
 */
export const CacheTags = {
  // Global tags
  ALL: "all",
  ORGANIZATIONS: "organizations",
  PROJECTS: "projects",
  STATS: "stats",
  TECH_STACK: "tech-stack",
  TOPICS: "topics",
  YEARS: "years",
  META: "meta",

  // Dynamic tag generators
  organization: (slug: string) => `organization:${slug}`,
  year: (year: number | string) => `year:${year}`,
  project: (id: string) => `project:${id}`,
  techStack: (slug: string) => `tech-stack:${slug}`,
  topic: (slug: string) => `topic:${slug}`,
} as const;

// =============================================================================
// CACHE DURATIONS - Optimized for data volatility patterns
// =============================================================================

/**
 * Cache duration constants in seconds.
 *
 * Strategy:
 * - IMMUTABLE: Historical year data (never changes) - 1 year
 * - LONG: Organization data (changes yearly) - 30 days
 * - MEDIUM: Aggregated stats - 7 days
 * - SHORT: Search results with filters - 1 hour
 * - CURRENT_YEAR: Current/upcoming year data - 1 day
 */
export const CacheDurations = {
  /** Immutable historical data - 1 year (365 days) */
  IMMUTABLE: 60 * 60 * 24 * 365,

  /** Long-lived data - 30 days */
  LONG: 60 * 60 * 24 * 30,

  /** Medium-lived data - 7 days */
  MEDIUM: 60 * 60 * 24 * 7,

  /** Short-lived data - 1 hour */
  SHORT: 60 * 60,

  /** Current year data - 1 day (more volatile during GSoC season) */
  CURRENT_YEAR: 60 * 60 * 24,

  /** Search/filter results - 1 hour */
  SEARCH: 60 * 60,
} as const;

// =============================================================================
// YEAR CLASSIFICATION - Determines cache strategy per year
// =============================================================================

/**
 * Determines if a year is historical (immutable) or current/upcoming.
 * Historical years get maximum caching; current years get shorter TTLs.
 */
export function isHistoricalYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  // Historical = 2 or more years in the past (data is fully finalized)
  return year < currentYear - 1;
}

/**
 * Gets the appropriate cache duration for a given year.
 */
export function getCacheDurationForYear(year: number): number {
  if (isHistoricalYear(year)) {
    return CacheDurations.IMMUTABLE;
  }
  return CacheDurations.CURRENT_YEAR;
}

/**
 * Gets cache tags for a specific year, including the global tags.
 */
export function getTagsForYear(year: number | string): string[] {
  return [CacheTags.ALL, CacheTags.YEARS, CacheTags.year(year)];
}

// =============================================================================
// CACHE WRAPPER FACTORY - Type-safe unstable_cache wrapper
// =============================================================================

/**
 * Options for creating a cached function.
 */
interface CacheOptions {
  /** Cache tags for invalidation */
  tags: string[];
  /** Cache duration in seconds */
  revalidate: number;
}

/**
 * Creates a cached version of an async function using Next.js unstable_cache.
 *
 * Features:
 * - Type-safe wrapper preserving function signature
 * - Automatic cache key generation from function name and arguments
 * - Tag-based invalidation support
 * - Configurable TTL
 *
 * @example
 * ```ts
 * const getOrganization = createCachedFn(
 *   'getOrganization',
 *   async (slug: string) => {
 *     return prisma.organizations.findUnique({ where: { slug } });
 *   },
 *   {
 *     tags: [CacheTags.ORGANIZATIONS],
 *     revalidate: CacheDurations.LONG,
 *   }
 * );
 * ```
 */
export function createCachedFn<TArgs extends unknown[], TReturn>(
  name: string,
  fn: (...args: TArgs) => Promise<TReturn>,
  options: CacheOptions
): (...args: TArgs) => Promise<TReturn> {
  return unstable_cache(fn, [name], {
    tags: options.tags,
    revalidate: options.revalidate,
  });
}

/**
 * Creates a cached function with dynamic tags based on arguments.
 * Useful when tags depend on the function arguments (e.g., year-specific caching).
 *
 * @example
 * ```ts
 * const getOrganizationsByYear = createDynamicCachedFn(
 *   'getOrganizationsByYear',
 *   async (year: number) => {
 *     return prisma.organizations.findMany({
 *       where: { active_years: { has: year } }
 *     });
 *   },
 *   (year) => ({
 *     tags: [...getTagsForYear(year), CacheTags.ORGANIZATIONS],
 *     revalidate: getCacheDurationForYear(year),
 *   })
 * );
 * ```
 */
export function createDynamicCachedFn<TArgs extends unknown[], TReturn>(
  name: string,
  fn: (...args: TArgs) => Promise<TReturn>,
  getOptions: (...args: TArgs) => CacheOptions
): (...args: TArgs) => Promise<TReturn> {
  // For dynamic caching, we create the cached function on each call
  // This allows different TTLs and tags based on arguments
  return async (...args: TArgs): Promise<TReturn> => {
    const options = getOptions(...args);
    const cachedFn = unstable_cache(fn, [name, ...args.map(String)], {
      tags: options.tags,
      revalidate: options.revalidate,
    });
    return cachedFn(...args);
  };
}

// =============================================================================
// CACHE KEY UTILITIES
// =============================================================================

/**
 * Generates a stable cache key from query parameters.
 * Normalizes and sorts params for consistent cache hits.
 */
export function createSearchCacheKey(params: Record<string, string | undefined>): string {
  const sortedEntries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .sort(([a], [b]) => a.localeCompare(b));

  return sortedEntries.map(([k, v]) => `${k}:${v}`).join("|") || "default";
}

// =============================================================================
// STALE-WHILE-REVALIDATE HEADERS FOR API ROUTES
// =============================================================================

/**
 * Cache-Control header values for API routes.
 *
 * Strategy:
 * - Use `s-maxage` for CDN/edge caching
 * - Use `stale-while-revalidate` for graceful updates
 * - Never use `max-age` alone (causes browser caching issues)
 */
export const CacheHeaders = {
  /** Immutable data - cache for 1 year, SWR for 1 week */
  IMMUTABLE: "public, s-maxage=31536000, stale-while-revalidate=604800",

  /** Long-lived data - cache for 30 days, SWR for 7 days */
  LONG: "public, s-maxage=2592000, stale-while-revalidate=604800",

  /** Medium-lived data - cache for 7 days, SWR for 1 day */
  MEDIUM: "public, s-maxage=604800, stale-while-revalidate=86400",

  /** Short-lived data - cache for 1 hour, SWR for 1 day */
  SHORT: "public, s-maxage=3600, stale-while-revalidate=86400",

  /** Current year data - cache for 1 day, SWR for 1 hour */
  CURRENT_YEAR: "public, s-maxage=86400, stale-while-revalidate=3600",

  /** Never cache - for health checks and admin endpoints */
  NO_CACHE: "no-store, no-cache, must-revalidate",
} as const;

/**
 * Gets appropriate Cache-Control header for a year-based response.
 */
export function getCacheHeaderForYear(year: number): string {
  return isHistoricalYear(year) ? CacheHeaders.IMMUTABLE : CacheHeaders.CURRENT_YEAR;
}

// =============================================================================
// ISR CONFIGURATION HELPERS
// =============================================================================

/**
 * ISR revalidation periods for page-level caching.
 * These are used with `export const revalidate = X` in page files.
 */
export const ISRPeriods = {
  /** Static pages (about, contact, etc.) - 30 days */
  STATIC: 60 * 60 * 24 * 30,

  /** Historical year pages - 1 year */
  HISTORICAL_YEAR: 60 * 60 * 24 * 365,

  /** Current year pages - 1 day */
  CURRENT_YEAR: 60 * 60 * 24,

  /** Organization detail pages - 30 days */
  ORGANIZATION: 60 * 60 * 24 * 30,

  /** Tech stack pages - 7 days */
  TECH_STACK: 60 * 60 * 24 * 7,

  /** Topic pages - 7 days */
  TOPICS: 60 * 60 * 24 * 7,

  /** Homepage - 1 day (shows trending data) */
  HOME: 60 * 60 * 24,
} as const;

// =============================================================================
// DO NOT CACHE LIST - Explicit exceptions
// =============================================================================

/**
 * Routes and patterns that should NEVER be cached.
 *
 * Reasons:
 * - Admin operations (must be real-time)
 * - Health checks (must reflect actual status)
 * - Write operations (POST/PUT/DELETE)
 */
export const DO_NOT_CACHE = {
  routes: [
    "/api/admin/*", // All admin routes
    "/api/health", // Health check
    "/api/v1/health", // V1 health check
  ],
  reasons: {
    "/api/admin/*": "Admin operations must be real-time and authenticated",
    "/api/health": "Health checks must reflect actual server status",
    "/api/v1/health": "Health checks must reflect actual server status",
  },
} as const;
