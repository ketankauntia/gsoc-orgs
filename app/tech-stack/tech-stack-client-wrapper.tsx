"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, TrendingUp, ArrowUpDown } from "lucide-react";
import {
  Grid,
  CardWrapper,
  Heading,
  Text,
  Input,
  Button,
} from "@/components/ui";
import type { TechSummary } from "@/lib/tech-stack-page-types";

interface TechStackClientWrapperProps {
  techs: TechSummary[];
}

type SortOption = "name" | "org-count-desc" | "org-count-asc" | "project-count-desc";

export function TechStackClientWrapper({ techs }: TechStackClientWrapperProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("org-count-desc");
  const [visibleCount, setVisibleCount] = useState(24);

  // Reset visible count when search or sort changes
  useEffect(() => {
    setVisibleCount(24);
  }, [searchQuery, sortBy]);

  // Filter and sort - CLIENT-SIDE ONLY
  const filteredTechs = useMemo(() => {
    let result = [...techs];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(query));
    }

    // Sort
    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "org-count-desc":
        result.sort((a, b) => b.org_count - a.org_count);
        break;
      case "org-count-asc":
        result.sort((a, b) => a.org_count - b.org_count);
        break;
      case "project-count-desc":
        result.sort((a, b) => b.project_count - a.project_count);
        break;
    }

    return result;
  }, [techs, searchQuery, sortBy]);

  const visibleTechs = filteredTechs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTechs.length;

  const trendingStacks = useMemo(() => {
    return [...techs].sort((a, b) => b.org_count - a.org_count).slice(0, 6);
  }, [techs]);

  return (
    <>
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search technologies by name..."
            className="pl-10 h-12 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Trending Technologies (only when not searching) */}
      {!searchQuery && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <Heading variant="subsection">Top Technologies</Heading>
          </div>
          <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="md">
            {trendingStacks.map((stack) => (
              <TechStackCard key={stack.slug} stack={stack} />
            ))}
          </Grid>
        </section>
      )}

      {/* All Tech Stacks */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Heading variant="section">
            {searchQuery ? "Search Results" : "All Technologies"}
          </Heading>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <Text variant="small" className="text-muted-foreground whitespace-nowrap">
              Sort by:
            </Text>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "org-count-desc" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("org-count-desc")}
                className="h-8 text-xs"
              >
                Most Orgs
              </Button>
              <Button
                variant={sortBy === "project-count-desc" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("project-count-desc")}
                className="h-8 text-xs"
              >
                Most Projects
              </Button>
              <Button
                variant={sortBy === "name" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("name")}
                className="h-8 text-xs"
              >
                Name A-Z
              </Button>
            </div>
          </div>
        </div>

        {filteredTechs.length === 0 ? (
          <CardWrapper className="text-center py-12">
            <Heading variant="small" className="mb-2">
              No technologies found
            </Heading>
            <Text className="text-muted-foreground">
              Try a different search term
            </Text>
          </CardWrapper>
        ) : (
          <>
            <Text variant="small" className="text-muted-foreground mb-6">
              Showing {visibleTechs.length} of {filteredTechs.length} technolog{filteredTechs.length !== 1 ? "ies" : "y"}
              {sortBy === "org-count-desc" && " (sorted by most organizations)"}
              {sortBy === "project-count-desc" && " (sorted by most projects)"}
              {sortBy === "name" && " (sorted alphabetically)"}
            </Text>
            <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
              {visibleTechs.map((stack) => (
                <TechStackCard key={stack.slug} stack={stack} />
              ))}
            </Grid>
            
            {hasMore && (
              <div className="mt-12 text-center">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => setVisibleCount(c => c + 24)}
                >
                  Load More Technologies
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

/**
 * Tech Stack Card Component
 */
function TechStackCard({ stack }: { stack: TechSummary }) {
  // Generate a color based on the tech name for consistency
  const getColor = (name: string) => {
    const colors = [
      "#3776AB", "#F7DF1E", "#007396", "#00599C", "#CE422B",
      "#00ADD8", "#3178C6", "#A8B9CC", "#CC342D", "#777BB4"
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Link href={`/tech-stack/${stack.slug}`} prefetch={true}>
      <CardWrapper hover className="h-full flex flex-col group">
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xl"
            style={{ backgroundColor: getColor(stack.name) }}
          >
            {stack.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <Heading variant="small" className="group-hover:text-primary transition-colors">
              {stack.name}
            </Heading>
            <Text variant="small" className="text-muted-foreground">
              {stack.org_count} org{stack.org_count !== 1 ? "s" : ""} • {stack.project_count} project{stack.project_count !== 1 ? "s" : ""}
            </Text>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t">
          <Text variant="small" className="text-primary group-hover:underline">
            View organizations →
          </Text>
        </div>
      </CardWrapper>
    </Link>
  );
}
