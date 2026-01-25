/**
 * Types for the Organizations Pages Data Structure
 * 
 * This file defines TypeScript interfaces for pre-computed
 * organizations page JSON data. Following architectural rules:
 * - Static JSON for list/detail pages
 * - API only for search and complex filters
 * - Pre-computed metadata for filters
 */

import { Organization, PaginatedResponse } from './api';

// ============================================
// Index Page Schema (/organizations)
// ============================================

export interface OrganizationsIndexData {
  slug: 'organizations-index';
  published_at: string;
  total: number;
  organizations: Array<{
    id: string;
    slug: string;
    name: string;
    category: string;
    description: string;
    image_url: string;
    img_r2_url?: string;
    logo_r2_url?: string | null;
    url: string;
    active_years: number[];
    first_year: number;
    last_year: number;
    is_currently_active: boolean;
    technologies: string[];
    topics: string[];
    total_projects: number;
    first_time: boolean | null;
  }>;
  meta: {
    version: number;
    generated_at: string;
  };
}

// ============================================
// Metadata Schema (filter data)
// ============================================

export interface OrganizationsMetadata {
  slug: 'organizations-metadata';
  published_at: string;
  technologies: Array<{
    name: string;
    count: number;
  }>;
  topics: Array<{
    name: string;
    count: number;
  }>;
  categories: Array<{
    name: string;
    count: number;
  }>;
  years: Array<{
    year: number;
    count: number;
  }>;
  totals: {
    organizations: number;
    technologies: number;
    topics: number;
    categories: number;
    years: number;
  };
  meta: {
    version: number;
    generated_at: string;
  };
}

// ============================================
// Loader Functions
// ============================================

/**
 * Load the organizations index data (for /organizations page)
 * 
 * Loads pre-computed static JSON data containing minimal fields for list view.
 * Falls back gracefully if JSON file is not available.
 * 
 * @returns {Promise<OrganizationsIndexData | null>} The organizations index data, or null if loading fails
 */
export async function loadOrganizationsIndexData(): Promise<OrganizationsIndexData | null> {
  try {
    const data = await import(`@/new-api-details/organizations/index.json`);
    if (process.env.NODE_ENV === 'development') {
      console.log('[ORGS] Successfully loaded JSON from static file');
    }
    return data.default as OrganizationsIndexData;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ORGS] Failed to load JSON, falling back to API:', error);
    }
    return null;
  }
}

/**
 * Load organization detail data for a specific slug
 * 
 * Loads pre-computed static JSON data for a single organization's detail page.
 * 
 * @param {string} slug - The organization slug (e.g., "rocketchat")
 * @returns {Promise<Organization | null>} The organization data, or null if not found
 */
export async function loadOrganizationData(slug: string): Promise<Organization | null> {
  try {
    const data = await import(`@/new-api-details/organizations/${slug}.json`);
    return data.default as Organization;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ORGS] Failed to load organization JSON for ${slug}:`, error);
    }
    return null;
  }
}

/**
 * Load organizations metadata (filter data)
 * 
 * Loads pre-computed metadata including technologies, topics, categories, and years
 * for use in filter components.
 * 
 * @returns {Promise<OrganizationsMetadata | null>} The metadata object, or null if loading fails
 */
export async function loadOrganizationsMetadata(): Promise<OrganizationsMetadata | null> {
  try {
    const data = await import(`@/new-api-details/organizations/metadata.json`);
    return data.default as OrganizationsMetadata;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ORGS] Failed to load metadata JSON:', error);
    }
    return null;
  }
}

/**
 * Convert index data to paginated response format
 * 
 * Transforms static index data into a paginated response structure for client-side pagination.
 * 
 * @param {OrganizationsIndexData} indexData - The organizations index data
 * @param {number} [page=1] - The page number (1-indexed)
 * @param {number} [limit=20] - The number of items per page
 * @returns {PaginatedResponse<Organization>} Paginated response with items, total, pages, etc.
 */
export function indexDataToPaginatedResponse(
  indexData: OrganizationsIndexData,
  page: number = 1,
  limit: number = 20
): PaginatedResponse<Organization> {
  const start = (page - 1) * limit;
  const end = start + limit;
  const items = indexData.organizations.slice(start, end);

  return {
    page,
    limit,
    total: indexData.total,
    pages: Math.ceil(indexData.total / limit),
    items: items as Organization[],
  };
}

/**
 * Filter organizations in memory (for static filters like year, category, tech)
 * 
 * Applies in-memory filtering to organizations array using OR logic for multi-value filters.
 * Used when static JSON is loaded and filters need to be applied client-side.
 * 
 * @param {OrganizationsIndexData['organizations']} organizations - Array of organizations to filter
 * @param {Object} filters - Filter criteria
 * @param {number[]} [filters.years] - Filter by active years (OR logic)
 * @param {string[]} [filters.categories] - Filter by categories (OR logic)
 * @param {string[]} [filters.techs] - Filter by technologies (OR logic)
 * @param {string[]} [filters.topics] - Filter by topics (OR logic)
 * @param {boolean} [filters.firstTimeOnly] - Filter to first-time organizations only
 * @returns {OrganizationsIndexData['organizations']} Filtered array of organizations
 */
export function filterOrganizations(
  organizations: OrganizationsIndexData['organizations'],
  filters: {
    years?: number[];
    categories?: string[];
    techs?: string[];
    topics?: string[];
    firstTimeOnly?: boolean;
  }
): OrganizationsIndexData['organizations'] {
  let filtered = [...organizations];

  // Years filter (OR logic - org must have participated in ANY selected year)
  if (filters.years && filters.years.length > 0) {
    filtered = filtered.filter(org =>
      filters.years!.some(year => org.active_years.includes(year))
    );
  }

  // Categories filter (OR logic - org must be in ANY selected category)
  if (filters.categories && filters.categories.length > 0) {
    filtered = filtered.filter(org =>
      filters.categories!.includes(org.category)
    );
  }

  // Technologies filter (OR logic - org must have ANY selected tech)
  if (filters.techs && filters.techs.length > 0) {
    filtered = filtered.filter(org =>
      filters.techs!.some(tech => org.technologies.includes(tech))
    );
  }

  // Topics filter (OR logic - org must have ANY selected topic)
  if (filters.topics && filters.topics.length > 0) {
    filtered = filtered.filter(org =>
      filters.topics!.some(topic => org.topics.includes(topic))
    );
  }

  // First-time organizations filter
  if (filters.firstTimeOnly) {
    filtered = filtered.filter(org => org.first_time === true);
  }

  return filtered;
}
