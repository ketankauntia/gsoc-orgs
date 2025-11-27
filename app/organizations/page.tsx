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

/**
 * Organizations Listing Page
 * Route: /organizations
 * 
 * TODO: Add data fetching
 * - Fetch from database or API
 * - Can use Server Components for SSR
 * - Or use client component with useEffect/React Query
 */

// Placeholder data - Replace with actual data fetching
const PLACEHOLDER_ORGS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Organization ${i + 1}`,
  slug: `org-${i + 1}`,
  description: "Building open-source tools and contributing to the developer community worldwide.",
  tech: ["Python", "JavaScript", "Go"],
  projects: Math.floor(Math.random() * 20) + 5,
  difficulty: ["Beginner", "Intermediate", "Advanced"][Math.floor(Math.random() * 3)],
  logo: null, // TODO: Add logo URLs
}));

/**
 * TODO: Replace with actual data fetching
 * Example with Server Component (SSR):
 * 
 * async function getOrganizations() {
 *   const res = await fetch('https://api.example.com/organizations', {
 *     cache: 'no-store', // or 'force-cache' for SSG
 *   });
 *   return res.json();
 * }
 * 
 * export default async function OrganizationsPage() {
 *   const organizations = await getOrganizations();
 *   ...
 * }
 */

export default function OrganizationsPage() {
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
        {/* Search Bar */}
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
        <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
          {PLACEHOLDER_ORGS.map((org) => (
            <OrganizationCard key={org.id} org={org} />
          ))}
        </Grid>
      </Suspense>

      {/* Load More / Pagination */}
      <div className="flex justify-center pt-8">
        <Button variant="outline" size="lg">
          Load More Organizations
        </Button>
      </div>
    </div>
  );
}

/**
 * Organization Card Component
 * TODO: Make this a separate reusable component in components/organizations/
 */
interface OrganizationCardProps {
  org: {
    id: number;
    name: string;
    slug: string;
    description: string;
    tech: string[];
    projects: number;
    difficulty: string;
    logo: string | null;
  };
}

function OrganizationCard({ org }: OrganizationCardProps) {
  return (
    <CardWrapper hover className="h-full flex flex-col">
      {/* Organization Logo/Icon */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
          {/* TODO: Replace with actual logo */}
          <span className="text-2xl font-bold text-muted-foreground">
            {org.name.charAt(0)}
          </span>
        </div>
        <div className="flex-1">
          <Heading variant="small" className="line-clamp-1">
            {org.name}
          </Heading>
          <Text variant="small" className="text-muted-foreground">
            {org.projects} projects
          </Text>
        </div>
      </div>

      {/* Description */}
      <Text variant="muted" className="line-clamp-3 mb-4 flex-1">
        {org.description}
      </Text>

      {/* Technologies */}
      <div className="flex flex-wrap gap-2 mb-4">
        {org.tech.slice(0, 3).map((tech) => (
          <Badge key={tech} variant="secondary" className="text-xs">
            {tech}
          </Badge>
        ))}
        {org.tech.length > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{org.tech.length - 3}
          </Badge>
        )}
      </div>

      {/* Difficulty Badge */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Badge
          variant={
            org.difficulty === "Beginner"
              ? "default"
              : org.difficulty === "Intermediate"
              ? "secondary"
              : "outline"
          }
        >
          {org.difficulty}
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

