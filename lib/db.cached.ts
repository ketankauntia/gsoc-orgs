/**
 * GSoC Organizations Guide - Cached Database Queries
 *
 * This module wraps Prisma queries with Next.js `unstable_cache` for
 * production-grade data caching. All queries are tagged for surgical
 * invalidation when data updates occur.
 *
 * Usage:
 * - Import cached queries instead of using prisma directly in pages
 * - Use raw prisma for admin/write operations
 * - Call revalidateTag() when data is updated
 *
 * @example
 * ```ts
 * // In a page component
 * import { getOrganizationBySlug } from '@/lib/db.cached';
 *
 * const org = await getOrganizationBySlug('apache');
 * ```
 */

import "server-only";

import prisma from "./prisma";
import {
  CacheTags,
  CacheDurations,
  createCachedFn,
  createDynamicCachedFn,
  getCacheDurationForYear,
  getTagsForYear,
  createSearchCacheKey,
  isHistoricalYear,
} from "./cache";
import { Prisma } from "@prisma/client";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** Organization list item (minimal fields for listings) */
export type OrganizationListItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  img_r2_url: string;
  logo_r2_url: string | null;
  url: string;
  active_years: number[];
  first_year: number;
  last_year: number;
  is_currently_active: boolean;
  technologies: string[];
  topics: string[];
  total_projects: number;
  first_time: boolean | null;
};

/** Full organization detail */
export type OrganizationDetail = Awaited<
  ReturnType<typeof prisma.organizations.findUnique>
>;

/** Pagination params */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Organization filter params */
export interface OrganizationFilterParams extends PaginationParams {
  q?: string;
  years?: number[];
  categories?: string[];
  techs?: string[];
  topics?: string[];
  firstTimeOnly?: boolean;
}

// =============================================================================
// ORGANIZATION QUERIES - CACHED
// =============================================================================

/**
 * Select fields for organization list items.
 * Excludes heavy fields like `years` (contains all projects).
 */
const organizationListSelect = {
  id: true,
  slug: true,
  name: true,
  category: true,
  description: true,
  image_url: true,
  img_r2_url: true,
  logo_r2_url: true,
  url: true,
  active_years: true,
  first_year: true,
  last_year: true,
  is_currently_active: true,
  technologies: true,
  topics: true,
  total_projects: true,
  first_time: true,
} satisfies Prisma.organizationsSelect;

/**
 * Get a single organization by slug.
 * Cached for 30 days with organization-specific tag.
 */
export const getOrganizationBySlug = createDynamicCachedFn(
  "getOrganizationBySlug",
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

/**
 * Get organization list item by slug (lighter query for listings).
 */
export const getOrganizationListItemBySlug = createDynamicCachedFn(
  "getOrganizationListItemBySlug",
  async (slug: string) => {
    return prisma.organizations.findUnique({
      where: { slug },
      select: organizationListSelect,
    });
  },
  (slug) => ({
    tags: [CacheTags.ALL, CacheTags.ORGANIZATIONS, CacheTags.organization(slug)],
    revalidate: CacheDurations.LONG,
  })
);

/**
 * Get all organization slugs (for generateStaticParams).
 * Cached for 30 days.
 */
export const getAllOrganizationSlugs = createCachedFn(
  "getAllOrganizationSlugs",
  async () => {
    const orgs = await prisma.organizations.findMany({
      select: { slug: true },
      orderBy: { name: "asc" },
    });
    return orgs.map((o) => o.slug);
  },
  {
    tags: [CacheTags.ALL, CacheTags.ORGANIZATIONS],
    revalidate: CacheDurations.LONG,
  }
);

/**
 * Get total organization count.
 */
export const getOrganizationCount = createCachedFn(
  "getOrganizationCount",
  async () => {
    return prisma.organizations.count();
  },
  {
    tags: [CacheTags.ALL, CacheTags.ORGANIZATIONS, CacheTags.STATS],
    revalidate: CacheDurations.LONG,
  }
);

// =============================================================================
// YEAR-BASED QUERIES - CACHED WITH YEAR-SPECIFIC TTLS
// =============================================================================

/**
 * Get organizations for a specific year.
 * Historical years cached for 1 year; current year for 1 day.
 */
export const getOrganizationsByYear = createDynamicCachedFn(
  "getOrganizationsByYear",
  async (year: number, limit: number = 500) => {
    return prisma.organizations.findMany({
      where: {
        active_years: { has: year },
      },
      select: {
        ...organizationListSelect,
        stats: true,
        years: true,
      },
      orderBy: { name: "asc" },
      take: limit,
    });
  },
  (year) => ({
    tags: [...getTagsForYear(year), CacheTags.ORGANIZATIONS],
    revalidate: getCacheDurationForYear(year),
  })
);

/**
 * Get year statistics.
 * Historical years cached for 1 year; current year for 1 day.
 */
export const getYearStats = createDynamicCachedFn(
  "getYearStats",
  async (year: number) => {
    const organizations = await prisma.organizations.findMany({
      where: {
        active_years: { has: year },
      },
      select: {
        slug: true,
        name: true,
        first_year: true,
        technologies: true,
        topics: true,
        category: true,
        stats: true,
      },
    });

    const totalOrgs = organizations.length;
    const newOrgs = organizations.filter((org) => org.first_year === year).length;

    // Calculate total projects for this year
    let totalProjects = 0;
    organizations.forEach((org) => {
      const yearKey = `year_${year}` as keyof typeof org.stats.projects_by_year;
      const projects = org.stats?.projects_by_year?.[yearKey];
      if (typeof projects === "number") {
        totalProjects += projects;
      }
    });

    // Technology distribution
    const techCounts = new Map<string, number>();
    organizations.forEach((org) => {
      org.technologies.forEach((tech) => {
        techCounts.set(tech, (techCounts.get(tech) || 0) + 1);
      });
    });

    const technologies = Array.from(techCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Topic distribution
    const topicCounts = new Map<string, number>();
    organizations.forEach((org) => {
      org.topics.forEach((topic) => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });

    const topics = Array.from(topicCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Category distribution
    const categoryCounts = new Map<string, number>();
    organizations.forEach((org) => {
      categoryCounts.set(org.category, (categoryCounts.get(org.category) || 0) + 1);
    });

    const categories = Array.from(categoryCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      year,
      overview: {
        total_organizations: totalOrgs,
        new_organizations: newOrgs,
        returning_organizations: totalOrgs - newOrgs,
        total_projects: totalProjects,
        avg_projects_per_org:
          totalOrgs > 0 ? Math.round((totalProjects / totalOrgs) * 10) / 10 : 0,
      },
      technologies: technologies.slice(0, 50),
      topics: topics.slice(0, 30),
      categories,
    };
  },
  (year) => ({
    tags: [...getTagsForYear(year), CacheTags.STATS],
    revalidate: getCacheDurationForYear(year),
  })
);

/**
 * Get all available years.
 */
export const getAllYears = createCachedFn(
  "getAllYears",
  async () => {
    const orgs = await prisma.organizations.findMany({
      select: { active_years: true },
    });

    const yearsSet = new Set<number>();
    orgs.forEach((org) => {
      org.active_years.forEach((year) => yearsSet.add(year));
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  },
  {
    tags: [CacheTags.ALL, CacheTags.YEARS],
    revalidate: CacheDurations.LONG,
  }
);

// =============================================================================
// GLOBAL STATISTICS - CACHED
// =============================================================================

/**
 * Get global platform statistics.
 * Cached for 7 days.
 */
export const getGlobalStats = createCachedFn(
  "getGlobalStats",
  async () => {
    const [totalOrganizations, activeOrganizations, totalProjects, organizations] =
      await Promise.all([
        prisma.organizations.count(),
        prisma.organizations.count({
          where: { is_currently_active: true },
        }),
        prisma.projects.count(),
        prisma.organizations.findMany({
          select: {
            technologies: true,
            topics: true,
            category: true,
            active_years: true,
          },
        }),
      ]);

    // Calculate unique technologies
    const uniqueTechs = new Set(organizations.flatMap((org) => org.technologies));

    // Calculate unique topics
    const uniqueTopics = new Set(organizations.flatMap((org) => org.topics));

    // Calculate unique categories
    const uniqueCategories = new Set(organizations.map((org) => org.category));

    // Calculate year range
    const allYears = organizations.flatMap((org) => org.active_years);
    const uniqueYears = new Set(allYears);
    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);

    // Top categories
    const categoryCounts = new Map<string, number>();
    organizations.forEach((org) => {
      categoryCounts.set(org.category, (categoryCounts.get(org.category) || 0) + 1);
    });
    const topCategories = Array.from(categoryCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top technologies
    const techCounts = new Map<string, number>();
    organizations.forEach((org) => {
      org.technologies.forEach((tech) => {
        techCounts.set(tech, (techCounts.get(tech) || 0) + 1);
      });
    });
    const topTechnologies = Array.from(techCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      overview: {
        total_organizations: totalOrganizations,
        active_organizations: activeOrganizations,
        inactive_organizations: totalOrganizations - activeOrganizations,
        total_projects: totalProjects,
        total_technologies: uniqueTechs.size,
        total_topics: uniqueTopics.size,
        total_categories: uniqueCategories.size,
      },
      years: {
        first: minYear,
        last: maxYear,
        total: uniqueYears.size,
        range: maxYear - minYear + 1,
      },
      top_categories: topCategories,
      top_technologies: topTechnologies,
    };
  },
  {
    tags: [CacheTags.ALL, CacheTags.STATS],
    revalidate: CacheDurations.MEDIUM,
  }
);

// =============================================================================
// TECH STACK QUERIES - CACHED
// =============================================================================

/**
 * Get all unique technologies with counts.
 */
export const getAllTechnologies = createCachedFn(
  "getAllTechnologies",
  async () => {
    const organizations = await prisma.organizations.findMany({
      select: { technologies: true },
    });

    const techCounts = new Map<string, number>();
    organizations.forEach((org) => {
      org.technologies.forEach((tech) => {
        techCounts.set(tech, (techCounts.get(tech) || 0) + 1);
      });
    });

    return Array.from(techCounts.entries())
      .map(([name, count]) => ({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  },
  {
    tags: [CacheTags.ALL, CacheTags.TECH_STACK],
    revalidate: CacheDurations.MEDIUM,
  }
);

/**
 * Get organizations by technology.
 */
export const getOrganizationsByTech = createDynamicCachedFn(
  "getOrganizationsByTech",
  async (tech: string, limit: number = 100) => {
    return prisma.organizations.findMany({
      where: {
        technologies: { has: tech },
      },
      select: organizationListSelect,
      orderBy: { total_projects: "desc" },
      take: limit,
    });
  },
  (tech) => ({
    tags: [CacheTags.ALL, CacheTags.TECH_STACK, CacheTags.techStack(tech)],
    revalidate: CacheDurations.MEDIUM,
  })
);

// =============================================================================
// TOPIC QUERIES - CACHED
// =============================================================================

/**
 * Get all unique topics with counts.
 */
export const getAllTopics = createCachedFn(
  "getAllTopics",
  async () => {
    const organizations = await prisma.organizations.findMany({
      select: { topics: true },
    });

    const topicCounts = new Map<string, number>();
    organizations.forEach((org) => {
      org.topics.forEach((topic) => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });

    return Array.from(topicCounts.entries())
      .map(([name, count]) => ({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  },
  {
    tags: [CacheTags.ALL, CacheTags.TOPICS],
    revalidate: CacheDurations.MEDIUM,
  }
);

/**
 * Get organizations by topic.
 */
export const getOrganizationsByTopic = createDynamicCachedFn(
  "getOrganizationsByTopic",
  async (topic: string, limit: number = 100) => {
    return prisma.organizations.findMany({
      where: {
        topics: { has: topic },
      },
      select: organizationListSelect,
      orderBy: { total_projects: "desc" },
      take: limit,
    });
  },
  (topic) => ({
    tags: [CacheTags.ALL, CacheTags.TOPICS, CacheTags.topic(topic)],
    revalidate: CacheDurations.MEDIUM,
  })
);

// =============================================================================
// PROJECT QUERIES - CACHED
// =============================================================================

/**
 * Get project by ID.
 */
export const getProjectById = createDynamicCachedFn(
  "getProjectById",
  async (projectId: string) => {
    return prisma.projects.findUnique({
      where: { project_id: projectId },
    });
  },
  (projectId) => ({
    tags: [CacheTags.ALL, CacheTags.PROJECTS, CacheTags.project(projectId)],
    revalidate: CacheDurations.LONG,
  })
);

/**
 * Get projects by year.
 */
export const getProjectsByYear = createDynamicCachedFn(
  "getProjectsByYear",
  async (year: number, limit: number = 100) => {
    return prisma.projects.findMany({
      where: { year },
      orderBy: { project_title: "asc" },
      take: limit,
    });
  },
  (year) => ({
    tags: [...getTagsForYear(year), CacheTags.PROJECTS],
    revalidate: getCacheDurationForYear(year),
  })
);

/**
 * Get projects by organization.
 */
export const getProjectsByOrganization = createDynamicCachedFn(
  "getProjectsByOrganization",
  async (orgSlug: string, limit: number = 100) => {
    return prisma.projects.findMany({
      where: { org_slug: orgSlug },
      orderBy: [{ year: "desc" }, { project_title: "asc" }],
      take: limit,
    });
  },
  (orgSlug) => ({
    tags: [CacheTags.ALL, CacheTags.PROJECTS, CacheTags.organization(orgSlug)],
    revalidate: CacheDurations.LONG,
  })
);

// =============================================================================
// SEARCH & FILTER - CACHED WITH SHORT TTL
// =============================================================================

/**
 * Search organizations with filters.
 * Uses shorter cache duration since results vary with query params.
 */
export async function searchOrganizations(params: OrganizationFilterParams) {
  const {
    page = 1,
    limit = 20,
    q,
    years = [],
    categories = [],
    techs = [],
    topics = [],
    firstTimeOnly = false,
  } = params;

  // Create stable cache key from params
  const cacheKey = createSearchCacheKey({
    page: String(page),
    limit: String(limit),
    q,
    years: years.join(","),
    categories: categories.join(","),
    techs: techs.join(","),
    topics: topics.join(","),
    firstTimeOnly: String(firstTimeOnly),
  });

  // Build where clause
  const whereConditions: Prisma.organizationsWhereInput[] = [];

  if (q) {
    whereConditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (years.length > 0) {
    whereConditions.push({
      OR: years.map((year) => ({
        active_years: { has: year },
      })),
    });
  }

  if (categories.length > 0) {
    whereConditions.push({
      OR: categories.map((category) => ({
        category,
      })),
    });
  }

  if (techs.length > 0) {
    whereConditions.push({
      OR: techs.map((tech) => ({
        technologies: { has: tech },
      })),
    });
  }

  if (topics.length > 0) {
    whereConditions.push({
      OR: topics.map((topic) => ({
        topics: { has: topic },
      })),
    });
  }

  if (firstTimeOnly) {
    whereConditions.push({ first_time: true });
  }

  const where: Prisma.organizationsWhereInput =
    whereConditions.length > 0 ? { AND: whereConditions } : {};

  // Create cached search function
  const cachedSearch = createCachedFn(
    `searchOrganizations:${cacheKey}`,
    async () => {
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        prisma.organizations.findMany({
          where,
          select: organizationListSelect,
          skip,
          take: limit,
          orderBy: { name: "asc" },
        }),
        prisma.organizations.count({ where }),
      ]);

      return {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        items,
      };
    },
    {
      tags: [CacheTags.ALL, CacheTags.ORGANIZATIONS],
      revalidate: CacheDurations.SEARCH,
    }
  );

  return cachedSearch();
}

// =============================================================================
// METADATA QUERIES - CACHED
// =============================================================================

/**
 * Get platform metadata (for /api/v1/meta endpoint).
 */
export const getPlatformMetadata = createCachedFn(
  "getPlatformMetadata",
  async () => {
    const [orgCount, projectCount, years, categories, technologies] =
      await Promise.all([
        prisma.organizations.count(),
        prisma.projects.count(),
        getAllYears(),
        prisma.organizations
          .findMany({ select: { category: true } })
          .then((orgs) => [...new Set(orgs.map((o) => o.category))].sort()),
        getAllTechnologies().then((techs) => techs.map((t) => t.name)),
      ]);

    return {
      counts: {
        organizations: orgCount,
        projects: projectCount,
        years: years.length,
        categories: categories.length,
        technologies: technologies.length,
      },
      ranges: {
        years: {
          min: Math.min(...years),
          max: Math.max(...years),
          available: years,
        },
      },
      values: {
        categories,
        top_technologies: technologies.slice(0, 50),
      },
    };
  },
  {
    tags: [CacheTags.ALL, CacheTags.META],
    revalidate: CacheDurations.LONG,
  }
);
