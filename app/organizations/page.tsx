import { Suspense } from "react";
import { Metadata } from "next";
import { PaginatedResponse, Organization } from "@/lib/api";
import { apiFetchServer } from "@/lib/api.server";
import { OrganizationsClient } from "./organizations-client";
import { getFullUrl } from "@/lib/constants";
import { loadTechStackIndexData } from "@/lib/tech-stack-page-types";
import {
  loadOrganizationsIndexData,
  filterOrganizations,
} from "@/lib/organizations-page-types";

/**
 * Organizations Listing Page
 * Route: /organizations
 * 
 * Hybrid approach:
 * - Static JSON for default list (no search, simple filters)
 * - API for search and complex filter combinations
 */
export const revalidate = 3600; // 1 hour

interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    category?: string;
    tech?: string;
    years?: string;
    categories?: string;
    techs?: string;
    topics?: string;
    firstTimeOnly?: string;
    yearsLogic?: string;
    categoriesLogic?: string;
    techsLogic?: string;
    topicsLogic?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  
  return {
    title: page === 1 
      ? "All GSoC Organizations - Google Summer of Code Organizations Guide"
      : `GSoC Organizations - Page ${page} - Google Summer of Code Organizations Guide`,
    description: "Explore all Google Summer of Code participating organizations. Filter by technology, difficulty level, and find the perfect match for your skills and interests.",
    alternates: {
      canonical: getFullUrl("/organizations"),
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: "All GSoC Organizations",
      description: "Explore all Google Summer of Code participating organizations",
      url: getFullUrl("/organizations"),
      type: "website",
      siteName: "GSoC Organizations Guide",
      images: [
        {
          url: `${getFullUrl("/og/gsoc-organizations-guide.jpg")}`,
          width: 1200,
          height: 630,
          alt: "GSoC Organizations Guide",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "All GSoC Organizations",
      description: "Explore all Google Summer of Code participating organizations",
      images: [`${getFullUrl("/og/gsoc-organizations-guide.jpg")}`],
    },
  };
}

/**
 * Determine if we should use API (search or complex filters)
 * vs static JSON (simple filters or no filters)
 */
function shouldUseAPI(params: {
  q?: string;
  years?: string;
  categories?: string;
  techs?: string;
  topics?: string;
  firstTimeOnly?: string;
  yearsLogic?: string;
  categoriesLogic?: string;
  techsLogic?: string;
  topicsLogic?: string;
}): boolean {
  // Always use API for search (text search requires DB)
  if (params.q && params.q.trim().length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ORGS] Using API: search query detected');
    }
    return true;
  }

  // Use API for complex filter logic (AND mode requires DB)
  if (params.yearsLogic === 'AND' || params.categoriesLogic === 'AND' ||
      params.techsLogic === 'AND' || params.topicsLogic === 'AND') {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ORGS] Using API: AND logic detected');
    }
    return true;
  }

  // Use API if multiple filter types are combined (complex combinations)
  const filterCount = [
    params.years && params.years.trim().length > 0,
    params.categories && params.categories.trim().length > 0,
    params.techs && params.techs.trim().length > 0,
    params.topics && params.topics.trim().length > 0,
    params.firstTimeOnly === 'true',
  ].filter(Boolean).length;

  // If more than 2 filter types, use API for better performance
  if (filterCount > 2) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ORGS] Using API: multiple filter types detected', filterCount);
    }
    return true;
  }

  // Otherwise, use static JSON
  if (process.env.NODE_ENV === 'development') {
    console.log('[ORGS] Using static JSON: simple filters or no filters');
  }
  return false;
}

/**
 * Fetch organizations from static JSON or API
 */
async function getOrganizations(params: {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  tech?: string;
  years?: string;
  categories?: string;
  techs?: string;
  topics?: string;
  firstTimeOnly?: string;
  yearsLogic?: string;
  categoriesLogic?: string;
  techsLogic?: string;
  topicsLogic?: string;
}): Promise<PaginatedResponse<Organization>> {
  // Use API for search or complex filters
  const useAPI = shouldUseAPI(params);
  
  if (useAPI) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ORGS] Using API - complex filters/search detected');
    }
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set("page", params.page.toString());
    if (params.limit) queryParams.set("limit", params.limit.toString());
    if (params.q) queryParams.set("q", params.q);
    if (params.category) queryParams.set("category", params.category);
    if (params.tech) queryParams.set("tech", params.tech);
    if (params.years) queryParams.set("years", params.years);
    if (params.categories) queryParams.set("categories", params.categories);
    if (params.techs) queryParams.set("techs", params.techs);
    if (params.topics) queryParams.set("topics", params.topics);
    if (params.firstTimeOnly) queryParams.set("firstTimeOnly", params.firstTimeOnly);
    if (params.yearsLogic) queryParams.set("yearsLogic", params.yearsLogic);
    if (params.categoriesLogic) queryParams.set("categoriesLogic", params.categoriesLogic);
    if (params.techsLogic) queryParams.set("techsLogic", params.techsLogic);
    if (params.topicsLogic) queryParams.set("topicsLogic", params.topicsLogic);

    const query = queryParams.toString();
    return apiFetchServer<PaginatedResponse<Organization>>(
      `/api/organizations${query ? `?${query}` : ""}`
    );
  }

  // Use static JSON for simple filters or no filters
  if (process.env.NODE_ENV === 'development') {
    console.log('[ORGS] Using static JSON');
  }
  const indexData = await loadOrganizationsIndexData();
  if (!indexData) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ORGS] JSON not available, falling back to API');
    }
    // Fallback to API if JSON not available
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set("page", params.page.toString());
    if (params.limit) queryParams.set("limit", params.limit.toString());
    const query = queryParams.toString();
    return apiFetchServer<PaginatedResponse<Organization>>(
      `/api/organizations${query ? `?${query}` : ""}`
    );
  }

  // Filter organizations in memory
  let filtered = indexData.organizations;

  // Apply filters
  if (params.years || params.categories || params.techs || params.topics || params.firstTimeOnly) {
    filtered = filterOrganizations(indexData.organizations, {
      years: params.years ? params.years.split(',').map(y => parseInt(y)).filter(n => !isNaN(n)) : undefined,
      categories: params.categories ? params.categories.split(',') : undefined,
      techs: params.techs ? params.techs.split(',') : params.tech ? [params.tech] : undefined,
      topics: params.topics ? params.topics.split(',') : undefined,
      firstTimeOnly: params.firstTimeOnly === 'true',
    });
  }

  // Convert filtered data to paginated response
  const page = params.page || 1;
  const limit = params.limit || 20;
  const total = filtered.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const items = filtered.slice(start, end);

  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    items: items as Organization[],
  };
}

export default async function OrganizationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  
  // Parallel data fetching: Orgs + Tech Stack
  const [data, techStackIndex] = await Promise.all([
    getOrganizations({ 
      page, 
      limit: 20,
      q: params.q,
      category: params.category,
      tech: params.tech,
      years: params.years,
      categories: params.categories,
      techs: params.techs,
      topics: params.topics,
      firstTimeOnly: params.firstTimeOnly,
      yearsLogic: params.yearsLogic,
      categoriesLogic: params.categoriesLogic,
      techsLogic: params.techsLogic,
      topicsLogic: params.topicsLogic,
    }),
    loadTechStackIndexData()
  ]);

  // Transform tech stack data for sidebar
  const initialTechs = techStackIndex?.all_techs.map(t => ({
    name: t.name,
    count: t.org_count
  })) || [];

  return (
    <Suspense fallback={
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    }>
      <OrganizationsClient 
        initialData={data} 
        initialPage={page} 
        initialTechs={initialTechs}
      />
    </Suspense>
  );
}
