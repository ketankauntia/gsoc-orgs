/**
 * Types for the Tech Stack Pages Data Structure
 * 
 * This file defines TypeScript interfaces for pre-computed
 * tech stack page JSON data. Following architectural rules:
 * - One document per technology
 * - No runtime aggregation
 * - Pre-computed metrics and charts
 */

// Shared chart types
export interface ChartBar {
  label: string;
  slug?: string;
  value: number;
  percentage?: number;
}

// ============================================
// Index Page Schema (/tech-stack)
// ============================================

export interface TechStackIndexData {
  slug: "tech-stack-index";
  published_at: string;

  metrics: {
    total_technologies: number;
    total_organizations: number;
  };

  all_techs: TechSummary[];

  charts: {
    top_tech_by_orgs: ChartBar[];
    top_tech_by_projects: ChartBar[];
    popularity_by_year: Record<string, Array<{ year: number; count: number }>>;
    fastest_growing: Array<{
      slug: string;
      name: string;
      growth_pct: number;
      first_year_count: number;
      last_year_count: number;
    }>;
    most_selections: Array<{
      name: string;
      slug: string;
      total: number;
      byYear: Array<{ year: number; count: number }>;
    }>;
    most_projects: Array<{
      name: string;
      slug: string;
      total: number;
      byYear: Array<{ year: number; count: number }>;
    }>;
  };

  meta: {
    version: number;
    generated_at: string;
  };
}

export interface TechSummary {
  name: string;
  slug: string;
  org_count: number;
  project_count: number;
}

// ============================================
// Per-Technology Page Schema (/tech-stack/[slug])
// ============================================

export interface TechStackPageData {
  slug: string;
  name: string;
  published_at: string;

  metrics: {
    org_count: number;
    project_count: number;
    avg_projects_per_org: number;
    first_year_used: number;
    latest_year_used: number;
  };

  organizations: TechOrgSnapshot[];

  charts: {
    popularity_by_year: Array<{
      year: number;
      org_count: number;
      project_count: number;
    }>;
  };

  meta: {
    version: number;
    generated_at: string;
  };
}

export interface TechOrgSnapshot {
  slug: string;
  name: string;
  logo_url: string | null;
  category: string;
  total_projects: number;
  is_currently_active: boolean;
  active_years: number[];
}

// ============================================
// Loader Functions
// ============================================

/**
 * Load the tech stack index data (for /tech-stack page)
 * 
 * Loads pre-computed static JSON data containing all technologies, metrics, and chart data.
 * 
 * @returns {Promise<TechStackIndexData | null>} The tech stack index data, or null if loading fails
 */
export async function loadTechStackIndexData(): Promise<TechStackIndexData | null> {
  try {
    const data = await import(`@/new-api-details/tech-stack/index.json`);
    return data.default as TechStackIndexData;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[TECH-STACK] Failed to load index JSON:', error);
    }
    return null;
  }
}

/**
 * Load tech stack page data for a specific technology
 * 
 * Loads pre-computed static JSON data for a single technology's detail page.
 * 
 * @param {string} slug - The tech slug (e.g., "typescript")
 * @returns {Promise<TechStackPageData | null>} The tech stack page data, or null if not found
 */
export async function loadTechStackPageData(slug: string): Promise<TechStackPageData | null> {
  try {
    const data = await import(`@/new-api-details/tech-stack/${slug}.json`);
    return data.default as TechStackPageData;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[TECH-STACK] Failed to load tech stack JSON for ${slug}:`, error);
    }
    return null;
  }
}

/**
 * Get list of available technology slugs (for generateStaticParams)
 * 
 * Retrieves all available technology slugs from the index data for static page generation.
 * 
 * @returns {Promise<string[]>} Array of technology slugs
 */
export async function getAvailableTechSlugs(): Promise<string[]> {
  const indexData = await loadTechStackIndexData();
  if (!indexData) return [];
  return indexData.all_techs.map((t) => t.slug);
}
