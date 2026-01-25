/**
 * Types for the Topics Pages Data Structure
 * 
 * This file defines TypeScript interfaces for pre-computed
 * topics page JSON data. Following architectural rules:
 * - Static JSON for list/detail pages
 * - Topics are derived from organizations data
 * - No runtime aggregation
 */

// ============================================
// Index Page Schema (/topics)
// ============================================

export interface TopicsIndexData {
  slug: 'topics-index';
  published_at: string;
  total: number;
  topics: Array<{
    slug: string;
    name: string;
    organizationCount: number;
    projectCount: number;
    years: number[];
  }>;
  meta: {
    version: number;
    generated_at: string;
  };
}

// ============================================
// Detail Page Schema (/topics/[slug])
// ============================================

export interface TopicPageData {
  slug: string;
  name: string;
  published_at: string;
  organizationCount: number;
  projectCount: number;
  years: number[];
  organizations: Array<{
    slug: string;
    name: string;
    first_year: number;
    last_year: number;
    total_projects: number;
    is_currently_active: boolean;
    active_years: number[];
  }>;
  yearlyStats: Record<string, {
    organizationCount: number;
    projectCount: number;
  }>;
  meta: {
    version: number;
    generated_at: string;
  };
}

// ============================================
// Loader Functions
// ============================================

/**
 * Load the topics index data (for /topics page)
 * 
 * Loads pre-computed static JSON data containing all topics with their metrics.
 * 
 * @returns {Promise<TopicsIndexData | null>} The topics index data, or null if loading fails
 */
export async function loadTopicsIndexData(): Promise<TopicsIndexData | null> {
  try {
    const data = await import(`@/new-api-details/topics/index.json`);
    if (process.env.NODE_ENV === 'development') {
      console.log('[TOPICS] Successfully loaded index JSON from static file');
    }
    return data.default as TopicsIndexData;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[TOPICS] Failed to load index JSON:', error);
    }
    return null;
  }
}

/**
 * Load topic detail data for a specific slug
 * 
 * Loads pre-computed static JSON data for a single topic's detail page.
 * 
 * @param {string} slug - The topic slug (e.g., "web-development")
 * @returns {Promise<TopicPageData | null>} The topic page data, or null if not found
 */
export async function loadTopicData(slug: string): Promise<TopicPageData | null> {
  try {
    const data = await import(`@/new-api-details/topics/${slug}.json`);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TOPICS] Successfully loaded topic JSON for: ${slug}`);
    }
    return data.default as TopicPageData;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[TOPICS] Failed to load topic JSON for ${slug}:`, error);
    }
    return null;
  }
}

/**
 * Filter topics in memory (for client-side filtering)
 * 
 * Applies in-memory filtering to topics array. Used when static JSON is loaded
 * and filters need to be applied client-side.
 * 
 * @param {TopicsIndexData['topics']} topics - Array of topics to filter
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.search] - Search query to match against topic name or slug
 * @param {number} [filters.minOrgs] - Minimum organization count
 * @param {number} [filters.minProjects] - Minimum project count
 * @param {number[]} [filters.years] - Filter by years (topic must appear in at least one year)
 * @returns {TopicsIndexData['topics']} Filtered array of topics
 */
export function filterTopics(
  topics: TopicsIndexData['topics'],
  filters: {
    search?: string;
    minOrgs?: number;
    minProjects?: number;
    years?: number[];
  }
): TopicsIndexData['topics'] {
  let filtered = [...topics];

  // Search filter
  if (filters.search && filters.search.trim().length > 0) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(topic =>
      topic.name.toLowerCase().includes(searchLower) ||
      topic.slug.toLowerCase().includes(searchLower)
    );
  }

  // Min organizations filter
  if (filters.minOrgs !== undefined) {
    filtered = filtered.filter(topic => topic.organizationCount >= filters.minOrgs!);
  }

  // Min projects filter
  if (filters.minProjects !== undefined) {
    filtered = filtered.filter(topic => topic.projectCount >= filters.minProjects!);
  }

  // Years filter (topic must have appeared in at least one of the selected years)
  if (filters.years && filters.years.length > 0) {
    filtered = filtered.filter(topic =>
      filters.years!.some(year => topic.years.includes(year))
    );
  }

  return filtered;
}
