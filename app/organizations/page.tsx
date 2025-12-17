export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Search } from "lucide-react";
import {
  SectionHeader,
  Grid,
  CardWrapper,
  Heading,
  Text,
  Badge,
  Button,
  Input,
} from "@/components/ui";
import { Organization, PaginatedResponse } from "@/lib/api";
import { apiFetchServer } from "@/lib/api.server";

/**
 * Organizations Listing Page
 * Route: /organizations
 * Fetches organizations from API
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

export default async function OrganizationsPage() {
  // Fetch organizations - default to first page with 12 items
  const data = await getOrganizations({ page: 1, limit: 12 });

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <SectionHeader
        badge="GSoC 2026"
        title="All Organizations"
        description="Explore all Google Summer of Code participating organizations. Filter by technology, difficulty level, and find the perfect match for your skills and interests."
        align="center"
        className="max-w-3xl mx-auto"
      />

      {/* Search and Filters Section */}
      <div className="space-y-6">
        {/* Search Bar - TODO: Make functional with client component */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search organizations by name, technology, or keyword..."
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Filter Tags - TODO: Make functional with state management */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            All
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            Python
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            JavaScript
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            Beginner Friendly
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            Machine Learning
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            Web Development
          </Badge>
        </div>
      </div>

      {/* Organizations Grid */}
      <Suspense fallback={<OrganizationsGridSkeleton />}>
        <div className="space-y-6">
          {/* Results count */}
          <div className="text-center text-muted-foreground">
            Showing {data.items.length} of {data.total} organizations
          </div>

          <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
            {data.items.map((org) => (
              <OrganizationCard key={org.id} org={org} />
            ))}
          </Grid>
        </div>
      </Suspense>

      {/* Load More / Pagination - TODO: Make functional */}
      {data.page < data.pages && (
        <div className="flex justify-center pt-8">
          <Button variant="outline" size="lg">
            Load More Organizations ({data.total - data.items.length} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Organization Card Component
 */
interface OrganizationCardProps {
  org: Organization;
}

function OrganizationCard({ org }: OrganizationCardProps) {
  return (
    <CardWrapper hover className="h-full flex flex-col">
      {/* Organization Logo/Icon */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {org.img_r2_url ? (
            <img
              src={org.img_r2_url}
              alt={`${org.name} logo`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">
              {org.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <Heading variant="small" className="line-clamp-1">
            {org.name}
          </Heading>
          <Text variant="small" className="text-muted-foreground">
            {org.total_projects} projects
          </Text>
        </div>
      </div>

      {/* Description */}
      <Text variant="muted" className="line-clamp-3 mb-4 flex-1">
        {org.description}
      </Text>

      {/* Technologies */}
      <div className="flex flex-wrap gap-2 mb-4">
        {org.technologies.slice(0, 3).map((tech) => (
          <Badge key={tech} variant="secondary" className="text-xs">
            {tech}
          </Badge>
        ))}
        {org.technologies.length > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{org.technologies.length - 3}
          </Badge>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Badge variant={org.is_currently_active ? "default" : "secondary"}>
          {org.is_currently_active ? "Active" : "Inactive"}
        </Badge>
        <Button variant="ghost" size="sm" asChild>
          <a href={`/organizations/${org.slug}`}>View Details →</a>
        </Button>
      </div>
    </CardWrapper>
  );
}

/**
 * Loading Skeleton for Organizations Grid
 */
function OrganizationsGridSkeleton() {
  return (
    <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardWrapper key={i} className="h-64 animate-pulse">
          <div className="h-full bg-muted/50 rounded-md" />
        </CardWrapper>
      ))}
    </Grid>
  );
}
