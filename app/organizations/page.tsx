import { Suspense } from "react";
import { Metadata } from "next";
import { PaginatedResponse, Organization } from "@/lib/api";
import { apiFetchServer } from "@/lib/api.server";
import { OrganizationsClient } from "./organizations-client";
import { getFullUrl } from "@/lib/constants";

/**
 * Organizations Listing Page
 * Route: /organizations
 * Supports pagination via ?page=N query parameter
 * SEO-optimized with canonical tags
 *
 * Caching Strategy:
 * - Uses ISR with 1 hour revalidation (search results vary by query)
 * - Query param variations are cached independently by Next.js
 * - API layer provides additional caching with longer TTLs
 *
 * Note: We use `dynamic = 'force-dynamic'` is NOT needed here because:
 * - Next.js App Router handles searchParams natively with ISR
 * - Each unique combination of query params gets its own cached version
 */
export const revalidate = 3600; // 1 hour - search pages need more frequent updates

interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    category?: string;
    tech?: string;
  }>;
}

/**
 * Generate metadata for SEO
 * All paginated pages point to the canonical /organizations URL
 */
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
 * Fetch organizations from API
 */
async function getOrganizations(params: {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  tech?: string;
}): Promise<PaginatedResponse<Organization>> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", params.page.toString());
  if (params.limit) queryParams.set("limit", params.limit.toString());
  if (params.q) queryParams.set("q", params.q);
  if (params.category) queryParams.set("category", params.category);
  if (params.tech) queryParams.set("tech", params.tech);

  const query = queryParams.toString();
  return apiFetchServer<PaginatedResponse<Organization>>(
    `/api/organizations${query ? `?${query}` : ""}`
  );
}

export default async function OrganizationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  
  // Fetch organizations - 20 items per page as recommended
  const data = await getOrganizations({ 
    page, 
    limit: 20,
    q: params.q,
    category: params.category,
    tech: params.tech,
  });

  return (
    <Suspense fallback={
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    }>
      <OrganizationsClient initialData={data} initialPage={page} />
    </Suspense>
  );
}
