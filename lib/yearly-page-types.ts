/**
 * Types for the Yearly Page Data Structure
 * 
 * This file defines the TypeScript interfaces for the pre-computed
 * yearly page JSON data. The data is stored as static JSON files
 * and loaded at build time for SSG.
 */

export interface ChartBar {
  label: string;
  slug?: string;
  value: number;
  org_count?: number;
  percentage?: number;
}

export interface ChartPie {
  total: number;
  data: ChartBar[];
}

export interface YearlyMetrics {
  total_organizations: number;
  total_projects: number;
  total_participants: number;
  total_mentors: number;
  first_time_organizations: number;
  returning_organizations: number;
  countries_participated: number | null;
  avg_projects_per_org: number;
  avg_mentors_per_org: number;
  avg_participants_per_org: number;
}

export interface OrganizationSnapshot {
  slug: string;
  name: string;
  logo_url: string;
  project_count: number;
  is_first_time: boolean;
}

export interface ProjectSnapshot {
  id: string;
  title: string;
  org_slug: string;
  tech_stack: string[];
  mentors?: string[];
  contributor?: string;
}

export interface TechStackEntry {
  slug: string;
  name: string;
  project_count: number;
  org_count: number;
}

export interface ParticipantsData {
  total: number;
  by_country?: Record<string, number>;
}

export interface MentorsData {
  total: number;
}

export interface FirstTimeOrg {
  slug: string;
  name: string;
  logo_url?: string;
}

export interface YearlyCharts {
  top_languages: ChartBar[];
  most_student_slots: ChartBar[];
  project_difficulty_distribution: ChartPie;
  orgs_with_most_projects: ChartBar[];
  highest_selections: {
    by_tech_stack: ChartBar[];
    by_organization: ChartBar[];
  };
}

export interface YearlyInsights {
  top_orgs_by_projects: Array<{
    slug: string;
    name: string;
    project_count: number;
  }>;
  fastest_growing_tech: Array<{
    slug: string;
    growth_pct: number;
  }>;
  notable_first_time_orgs: Array<{
    slug: string;
    reason: string;
  }>;
}

export interface YearlyMeta {
  version: number;
  generated_at: string;
  data_source?: string;
  notes?: string;
}

export interface YearlyPageData {
  year: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  published_at: string;
  finalized: boolean;

  metrics: YearlyMetrics;
  organizations: OrganizationSnapshot[];
  projects: ProjectSnapshot[];
  tech_stack: TechStackEntry[];
  participants: ParticipantsData;
  mentors: MentorsData;
  first_time_orgs: FirstTimeOrg[];
  charts: YearlyCharts;
  insights?: YearlyInsights;
  meta: YearlyMeta;
}

/**
 * Helper function to load yearly page data from the JSON file
 * @param slug - The slug of the yearly page (e.g., "google-summer-of-code-2025")
 * @returns The yearly page data or null if not found
 */
export async function loadYearlyPageData(slug: string): Promise<YearlyPageData | null> {
  try {
    // Dynamic import of JSON file
    const data = await import(`@/new-api-details/yearly/${slug}.json`);
    return data.default as YearlyPageData;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[YEARLY] Failed to load yearly page JSON for ${slug}:`, error);
    }
    return null;
  }
}
