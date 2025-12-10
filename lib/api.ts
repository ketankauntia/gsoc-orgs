/**
 * API Configuration and Utilities
 * Centralized API fetching logic for the application
 */

// Get base URL - for server-side, use localhost, for client use relative
function getBaseUrl() {
  // Browser should use relative URL
  if (typeof window !== 'undefined') {
    return '';
  }
  
  // Server should use absolute URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  return `http://localhost:${process.env.PORT || 3000}`;
}

export const API_BASE = getBaseUrl();

/**
 * Custom API fetch wrapper with error handling
 * @param path - API endpoint path (e.g., '/api/organizations')
 * @param opts - Fetch options
 */
export async function apiFetch<T = any>(
  path: string,
  opts?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...opts?.headers,
    },
    ...opts,
  });

  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If JSON parsing fails, use statusText
    }

    const error: any = new Error(errorMessage);
    error.status = res.status;
    throw error;
  }

  return res.json();
}

/**
 * Build query string from params object
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * API Response Types
 */

export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  pages: number;
  items: T[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  image_url: string;
  logo_r2_url: string | null;
  technologies: string[];
  topics: string[];
  total_projects: number;
  is_currently_active: boolean;
  first_year: number;
  last_year: number;
  active_years: number[];
  stats?: any;
  years?: any;
  contact?: any;
  social?: any;
}

export interface TechStack {
  name: string;
  slug: string;
  usage_count: number;
}

export interface Project {
  id: string;
  project_id: string;
  project_title: string;
  project_abstract_short: string;
  project_info_html: string;
  org_name: string;
  org_slug: string;
  contributor: string;
  mentors: string[];
  year: number;
  project_code_url?: string;
}

export interface Stats {
  organizations: {
    total: number;
    active: number;
    inactive: number;
  };
  projects: {
    total: number;
  };
  technologies: {
    total: number;
  };
  years: {
    first: number;
    last: number;
    range: number;
  };
  timestamp: string;
}
