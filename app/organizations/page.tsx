import { Suspense } from "react";
import { Metadata } from "next";
import { PaginatedResponse, Organization } from "@/lib/api";
import { apiFetchServer } from "@/lib/api.server";
import { OrganizationsClient } from "./organizations-client";
import { LinkDirectory } from "@/components/link-directory";
import { buildPageMetadata } from "@/lib/seo";
import {
  loadOrganizationsIndexData,
  loadOrganizationsMetadata,
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
  
  return buildPageMetadata({
    title: page === 1 ? "All GSoC Organizations" : `GSoC Organizations - Page ${page}`,
    description:
      "Explore every Google Summer of Code participating organization. Filter by technology, topic, and year to find the right match for your skills.",
    path: "/organizations",
  });
}

/**
 * Determine if we should use API (search or complex filters)
 * vs static JSON (simple filters or no filters)
 */
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
  // The normalized static index is small enough to support every filter mode.
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

  // Filter organizations in memory (supports text search + all filters)
  let filtered = indexData.organizations;

  const hasFilters = params.q || params.years || params.categories || params.techs || params.topics || params.firstTimeOnly || params.tech;
  if (hasFilters) {
    filtered = filterOrganizations(indexData.organizations, {
      query: params.q,
      years: params.years ? params.years.split(',').map(y => parseInt(y)).filter(n => !isNaN(n)) : undefined,
      categories: params.categories ? params.categories.split(',') : undefined,
      techs: params.techs ? params.techs.split(',') : params.tech ? [params.tech] : undefined,
      topics: params.topics ? params.topics.split(',') : undefined,
      yearsLogic: params.yearsLogic === 'AND' ? 'AND' : 'OR',
      categoriesLogic: params.categoriesLogic === 'AND' ? 'AND' : 'OR',
      techsLogic: params.techsLogic === 'AND' ? 'AND' : 'OR',
      topicsLogic: params.topicsLogic === 'AND' ? 'AND' : 'OR',
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
  
  const [data, metadata, orgIndex] = await Promise.all([
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
    loadOrganizationsMetadata(),
    loadOrganizationsIndexData()
  ]);

  const initialTechs = metadata?.technologies ?? [];
  const initialTopics = metadata?.topics ?? [];

  const firstTimeCount = orgIndex?.organizations.filter(
    (o: { first_time: boolean | null }) => o.first_time === true
  ).length ?? 0;

  return (
    <Suspense fallback={
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    }>
      <>
        <OrganizationsClient 
          initialData={data} 
          initialPage={page} 
          initialTechs={initialTechs}
          initialTopics={initialTopics}
          firstTimeCount={firstTimeCount}
        />
        <div className="mx-auto max-w-6xl px-6 pb-16">
          <LinkDirectory
            title="All GSoC organizations A–Z"
            description="Every organization in the archive. The list above paginates on the client, so this index keeps each organization page linked."
            entries={(orgIndex?.organizations ?? []).map((organization) => ({
              href: `/organizations/${organization.slug}`,
              label: organization.name,
            }))}
          />
        </div>
      </>
    </Suspense>
  );
}
