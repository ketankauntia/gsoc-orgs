"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, TrendingUp, BarChart3, Users, Rocket, ArrowUpDown } from "lucide-react";
import {
  SectionHeader,
  Grid,
  CardWrapper,
  Heading,
  Text,
  Input,
  Button,
} from "@/components/ui";
import { StackPopularityChart, TopStacksChart, MostSelectionsChart, MostProjectsChart, PopularityGrowthChart } from "./charts";

/**
 * Tech Stack Index Page
 * Route: /tech-stack
 * Fetches tech stacks from API
 */

interface TechStack {
  name: string;
  slug: string;
  usage_count: number;
}

interface AnalyticsData {
  topTechStacks: Array<{ name: string; slug: string; count: number }>;
  stackPopularityByYear: Record<string, Array<{ year: number; count: number }>>;
  mostSelections: Array<{
    name: string;
    total: number;
    byYear: Array<{ year: number; count: number }>;
  }>;
  mostProjects: Array<{
    name: string;
    total: number;
    byYear: Array<{ year: number; count: number }>;
  }>;
  popularityGrowth: Array<{
    name: string;
    percentIncrease: number;
    total: number;
    firstYear: number;
    lastYear: number;
    byYear: Array<{ year: number; count: number }>;
  }>;
  totalOrganizations: number;
}

type SortOption = "name" | "count-desc" | "count-asc";

export default function TechStackPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [techStacks, setTechStacks] = useState<TechStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("count-desc");

  useEffect(() => {
    async function fetchTechStacks() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        
        const response = await fetch(`/api/tech-stack?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        setTechStacks(data.items || []);
        setError(null);
      } catch (err) {
        setError('Failed to load technologies');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    const debounce = setTimeout(() => {
      fetchTechStacks();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setAnalyticsLoading(true);
        const response = await fetch('/api/tech-stack/analytics');
        if (!response.ok) throw new Error('Failed to fetch analytics');
        
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  const trendingStacks = techStacks.slice(0, 6); // Top 6 as trending

  // Sort tech stacks based on selected option
  const sortedTechStacks = [...techStacks].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "count-desc":
        return b.usage_count - a.usage_count;
      case "count-asc":
        return a.usage_count - b.usage_count;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <SectionHeader
        badge="Browse by Technology"
        title="Programming Languages & Technologies"
        description="Explore Google Summer of Code organizations and projects filtered by programming language. Find opportunities that match your technical expertise."
        align="center"
        className="max-w-3xl mx-auto"
      />

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

      {/* Analytics Section */}
      {!searchQuery && (
        <section className="space-y-8">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <Heading variant="subsection">Technology Analytics</Heading>
          </div>

          {analyticsLoading ? (
            <Grid cols={{ default: 1, lg: 2 }} gap="lg">
              {Array.from({ length: 2 }).map((_, i) => (
                <CardWrapper key={i} className="h-80 animate-pulse">
                  <div className="h-full bg-muted/50 rounded-md" />
                </CardWrapper>
              ))}
            </Grid>
          ) : analytics ? (
            <>
              {/* First Row: 2 Charts */}
              <Grid cols={{ default: 1, lg: 2 }} gap="lg">
                {/* Stack Popularity Over Years */}
                <CardWrapper className="p-6">
                  <div className="mb-4">
                    <Heading variant="small" className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-teal-600" />
                      Stack Popularity Over the Years
                    </Heading>
                    <Text variant="small" className="text-muted-foreground mt-1">
                      Organization adoption trends - select technologies to compare
                    </Text>
                  </div>
                  <StackPopularityChart 
                    data={analytics.stackPopularityByYear} 
                    availableTechs={analytics.topTechStacks}
                  />
                </CardWrapper>

                {/* Top Tech Stacks */}
                <CardWrapper className="p-6">
                  <div className="mb-4">
                    <Heading variant="small" className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-teal-600" />
                      Top Tech Stacks by Org Count
                    </Heading>
                    <Text variant="small" className="text-muted-foreground mt-1">
                      Most popular technologies in GSoC
                    </Text>
                  </div>
                  <TopStacksChart data={analytics.topTechStacks} />
                </CardWrapper>
              </Grid>

              {/* Second Row: 2 Charts */}
              <Grid cols={{ default: 1, lg: 2 }} gap="lg">
                {/* Most Selections */}
                <CardWrapper className="p-6">
                  <div className="mb-4">
                    <Heading variant="small" className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-600" />
                      Tech Stacks with Most Selections
                    </Heading>
                    <Text variant="small" className="text-muted-foreground mt-1">
                      2025-2020 - Organizations selected by technology
                    </Text>
                  </div>
                  <MostSelectionsChart data={analytics.mostSelections} />
                </CardWrapper>

                {/* Most Projects */}
                <CardWrapper className="p-6">
                  <div className="mb-4">
                    <Heading variant="small" className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-teal-600" />
                      Tech Stacks with Most Projects
                    </Heading>
                    <Text variant="small" className="text-muted-foreground mt-1">
                      2025-2020 - Total projects by technology
                    </Text>
                  </div>
                  <MostProjectsChart data={analytics.mostProjects} />
                </CardWrapper>
              </Grid>

              {/* Third Row: 1 Expanded Chart */}
              <CardWrapper className="p-6">
                <div className="mb-4">
                  <Heading variant="small" className="text-base flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-teal-600" />
                    Tech Stacks with Highest Growth in Popularity
                  </Heading>
                  <Text variant="small" className="text-muted-foreground mt-1">
                    2025-2020 - Shows % growth and total projects allocated
                  </Text>
                </div>
                <PopularityGrowthChart data={analytics.popularityGrowth} />
              </CardWrapper>
            </>
          ) : null}
        </section>
      )}

      {/* Error State */}
      {error && (
        <CardWrapper className="text-center py-8 bg-destructive/10">
          <Text className="text-destructive">{error}</Text>
        </CardWrapper>
      )}

      {/* Loading State */}
      {loading && (
        <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardWrapper key={i} className="h-48 animate-pulse">
              <div className="h-full bg-muted/50 rounded-md" />
            </CardWrapper>
          ))}
        </Grid>
      )}

      {/* Trending Technologies */}
      {!loading && !searchQuery && trendingStacks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <Heading variant="subsection">Top Technologies</Heading>
          </div>
          <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="md">
            {trendingStacks.map((stack, index) => (
              <TechStackCard key={`trending-${stack.name}-${index}`} stack={stack} />
            ))}
          </Grid>
        </section>
      )}

      {/* All Tech Stacks */}
      {!loading && !error && (
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
                  variant={sortBy === "count-desc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("count-desc")}
                  className="h-8 text-xs"
                >
                  Most Orgs
                </Button>
                <Button
                  variant={sortBy === "count-asc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("count-asc")}
                  className="h-8 text-xs"
                >
                  Least Orgs
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
          
          {sortedTechStacks.length === 0 ? (
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
                Showing {sortedTechStacks.length} technolog{sortedTechStacks.length !== 1 ? "ies" : "y"}
                {sortBy === "count-desc" && " (sorted by most organizations)"}
                {sortBy === "count-asc" && " (sorted by least organizations)"}
                {sortBy === "name" && " (sorted alphabetically)"}
              </Text>
              <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
                {sortedTechStacks.map((stack, index) => (
                  <TechStackCard key={`${stack.name}-${index}`} stack={stack} />
                ))}
              </Grid>
            </>
          )}
        </section>
      )}
    </div>
  );
}

/**
 * Tech Stack Card Component
 */
function TechStackCard({ stack }: { stack: TechStack }) {
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
    <Link href={`/tech-stack/${stack.slug}`}>
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
              {stack.usage_count} organization{stack.usage_count !== 1 ? 's' : ''}
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
