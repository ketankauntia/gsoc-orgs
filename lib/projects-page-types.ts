/**
 * Types for the Projects Year Page Data Structure
 * 
 * This file defines the TypeScript interfaces for the pre-computed
 * projects year page JSON data. Following architectural rules:
 * - One document per year
 * - No runtime aggregation
 * - Pre-computed metrics and charts
 */

// Shared chart type
export interface ChartBar {
  label: string;
  slug?: string;
  value: number;
  percentage?: number;
}

export interface ChartPie {
  total: number;
  data: ChartBar[];
}

// Core metrics for the year
export interface ProjectYearMetrics {
  total_projects: number;
  total_organizations: number;
  avg_projects_per_org: number;
  first_time_org_projects: number;
}

// Project entry in the list
export interface ProjectEntry {
  project_id: string;
  project_title: string;
  project_abstract_short?: string;
  project_code_url?: string;
  contributor: string;
  mentors: string[];
  org_name: string;
  org_slug: string;
  year: number;
  date_created?: string;
  date_updated?: string;
  tech_stack?: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
}

// Organization snapshot for display
export interface OrgSnapshot {
  slug: string;
  name: string;
  logo_url?: string;
  project_count: number;
  is_first_time: boolean;
}

// Pre-computed charts
export interface ProjectYearCharts {
  top_technologies: ChartBar[];
  orgs_with_most_projects: ChartBar[];
  project_difficulty_distribution?: ChartPie;
}

// Insights for the page
export interface ProjectYearInsights {
  top_org: { name: string; slug: string; count: number } | null;
  top_tech: { name: string; percentage: number } | null;
  first_time_org_percentage: number;
  difficulty_summary?: string;
  avg_tech_stack_size?: number;
}

// Main page data structure
export interface ProjectYearPageData {
  year: number;
  slug: string;
  title: string;
  description: string;
  published_at: string;
  finalized: boolean;

  metrics: ProjectYearMetrics;
  projects: ProjectEntry[];
  first_time_orgs: OrgSnapshot[];
  charts: ProjectYearCharts;
  insights: ProjectYearInsights;
}

/**
 * Helper function to load projects year data from the JSON file
 * @param year - The year to load (e.g., 2025)
 * @returns The projects year page data or null if not found
 */
export async function loadProjectsYearData(year: number): Promise<ProjectYearPageData | null> {
  try {
    const data = await import(`@/new-api-details/projects/${year}.json`);
    return data.default as ProjectYearPageData;
  } catch {
    return null;
  }
}

/**
 * Get list of available years
 */
export function getAvailableProjectYears(): number[] {
  return [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
}
