"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, TrendingUp, BarChart3, Users, Code, ArrowUpDown } from "lucide-react";
import {
  Heading,
  Text,
  Badge,
  Button,
  CardWrapper,
  Grid,
  Input,
  SectionHeader,
} from "@/components/ui";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

interface TechStackDetail {
  technology: {
    name: string;
    slug: string;
    usage_count: number;
  };
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    logo_r2_url: string | null;
    img_r2_url: string | null;
    category: string;
    total_projects: number;
    is_currently_active: boolean;
    technologies: string[];
    active_years: number[];
  }>;
}

interface AnalyticsData {
  technology: {
    name: string;
    slug: string;
    usage_count: number;
  };
  stats: {
    totalOrganizations: number;
    activeOrganizations: number;
    totalProjects: number;
    activeYears: number[];
  };
  analytics: {
    orgGrowthByYear: Array<{ year: number; count: number }>;
    projectsByYear: Array<{ year: number; count: number }>;
    difficultyDistribution: Array<{ level: string; count: number }>;
  };
}

type SortOption = "name" | "projects-desc" | "projects-asc" | "year-desc" | "year-asc";

export function TechStackClient({ initialData }: { initialData: TechStackDetail }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("projects-desc");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setAnalyticsLoading(true);
        const response = await fetch(`/api/tech-stack/${initialData.technology.slug}/analytics`);
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
  }, [initialData.technology.slug]);

  // Filter and sort organizations
  const filteredAndSortedOrgs = useMemo(() => {
    let filtered = initialData.organizations.filter(org => {
      const query = searchQuery.toLowerCase();
      return (
        org.name.toLowerCase().includes(query) ||
        org.description.toLowerCase().includes(query) ||
        org.category.toLowerCase().includes(query) ||
        org.technologies.some(tech => tech.toLowerCase().includes(query))
      );
    });

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "projects-desc":
          return b.total_projects - a.total_projects;
        case "projects-asc":
          return a.total_projects - b.total_projects;
        case "year-desc":
          const aYear = Math.max(...(a.active_years || [0]));
          const bYear = Math.max(...(b.active_years || [0]));
          return bYear - aYear;
        case "year-asc":
          const aYearAsc = Math.max(...(a.active_years || [0]));
          const bYearAsc = Math.max(...(b.active_years || [0]));
          return aYearAsc - bYearAsc;
        default:
          return 0;
      }
    });

    return filtered;
  }, [initialData.organizations, searchQuery, sortBy]);

  const { technology, organizations } = initialData;
  const activeOrgs = organizations.filter(o => o.is_currently_active).length;
  const totalProjects = organizations.reduce((sum, org) => sum + org.total_projects, 0);

  // Teal color palette
  const TEAL_COLORS = [
    "#0d9488", // teal-600
    "#14b8a6", // teal-500
    "#2dd4bf", // teal-400
    "#5eead4", // teal-300
  ];

  return (
    <div className="space-y-12" suppressHydrationWarning>
      {/* Header */}
      <SectionHeader
        badge="Technology"
        title={technology.name}
        description={`${technology.usage_count} organization${technology.usage_count !== 1 ? 's' : ''} using ${technology.name}`}
        align="center"
        className="max-w-3xl mx-auto"
      />

      {/* Stats */}
      <section>
        <Grid cols={{ default: 2, md: 3 }} gap="md">
          <CardWrapper className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-5 h-5 text-teal-600" />
              <Text variant="small" className="text-muted-foreground">
                Organizations
              </Text>
            </div>
            <Heading variant="small">{technology.usage_count}</Heading>
          </CardWrapper>
          <CardWrapper className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-5 h-5 text-teal-600" />
              <Text variant="small" className="text-muted-foreground">
                Active Orgs
              </Text>
            </div>
            <Heading variant="small">{activeOrgs}</Heading>
          </CardWrapper>
          <CardWrapper className="p-6 text-center col-span-2 md:col-span-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Code className="w-5 h-5 text-teal-600" />
              <Text variant="small" className="text-muted-foreground">
                Total Projects
              </Text>
            </div>
            <Heading variant="small">{totalProjects}</Heading>
          </CardWrapper>
        </Grid>
      </section>

      {/* Analytics Charts */}
      {analyticsLoading ? (
        <section>
          <Heading variant="section" className="mb-6">
            {technology.name} Analytics
          </Heading>
          <Grid cols={{ default: 1, lg: 2 }} gap="lg">
            {Array.from({ length: 2 }).map((_, i) => (
              <CardWrapper key={i} className="h-80 animate-pulse">
                <div className="h-full bg-muted/50 rounded-md" />
              </CardWrapper>
            ))}
          </Grid>
        </section>
      ) : analytics ? (
        <section>
          <Heading variant="section" className="mb-6">
            {technology.name} Analytics
          </Heading>
          <Grid cols={{ default: 1, lg: 2 }} gap="lg">
            {/* Organization Growth Trend */}
            <CardWrapper className="p-6">
              <div className="mb-4">
                <Heading variant="small" className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  Organization Growth Trend
                </Heading>
                <Text variant="small" className="text-muted-foreground mt-1">
                  Number of organizations using {technology.name} over years
                </Text>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.analytics.orgGrowthByYear}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [value, "Organizations"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#0d9488"
                      strokeWidth={2}
                      dot={{ fill: "#0d9488", strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardWrapper>

            {/* Projects Over Years */}
            <CardWrapper className="p-6">
              <div className="mb-4">
                <Heading variant="small" className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  Projects Over Years
                </Heading>
                <Text variant="small" className="text-muted-foreground mt-1">
                  Total projects using {technology.name} by year
                </Text>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.analytics.projectsByYear}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [value.toLocaleString(), "Projects"]}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                      {analytics.analytics.projectsByYear.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={TEAL_COLORS[index % TEAL_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardWrapper>

          </Grid>
        </section>
      ) : null}

      {/* Organizations Section */}
      <section>
        {/* Heading - Centered */}
        <div className="text-center mb-6">
          <Heading variant="section">
            GSoC Organizations Using {technology.name}
          </Heading>
        </div>

        {/* Sort Controls - Centered */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <Text variant="small" className="text-muted-foreground whitespace-nowrap">
              Sort by:
            </Text>
            <div className="flex gap-2 flex-wrap justify-center">
              <Button
                variant={sortBy === "projects-desc" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("projects-desc")}
                className="h-8 text-xs"
              >
                Most Projects
              </Button>
              <Button
                variant={sortBy === "projects-asc" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("projects-asc")}
                className="h-8 text-xs"
              >
                Least Projects
              </Button>
              <Button
                variant={sortBy === "name" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("name")}
                className="h-8 text-xs"
              >
                Name A-Z
              </Button>
              <Button
                variant={sortBy === "year-desc" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("year-desc")}
                className="h-8 text-xs"
              >
                Latest Year
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar - Centered */}
        <div className="mb-6 flex justify-center">
          <div className="relative max-w-2xl w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search organizations by name, description, category, or technology..."
              className="pl-10 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Organizations Grid */}
        {filteredAndSortedOrgs.length === 0 ? (
          <CardWrapper className="text-center py-12">
            <Heading variant="small" className="mb-2">
              No organizations found
            </Heading>
            <Text className="text-muted-foreground">
              Try adjusting your search or filters
            </Text>
          </CardWrapper>
        ) : (
          <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
            {filteredAndSortedOrgs.map((org) => (
              <OrganizationCard key={org.id} org={org} />
            ))}
          </Grid>
        )}
      </section>

      {/* CTA */}
      <section className="text-center">
        <Button size="lg" asChild>
          <Link href="/tech-stack">View All Technologies</Link>
        </Button>
      </section>
    </div>
  );
}

/**
 * Organization Card Component - Matching the organizations page design
 */
function OrganizationCard({ org }: { 
  org: {
    id: string;
    name: string;
    slug: string;
    description: string;
    logo_r2_url: string | null;
    img_r2_url: string | null;
    category: string;
    total_projects: number;
    is_currently_active: boolean;
    technologies: string[];
    active_years: number[];
  }
}) {
  const logoUrl = org.logo_r2_url || org.img_r2_url;

  return (
    <Link href={`/organizations/${org.slug}`}>
      <CardWrapper hover className="h-full flex flex-col">
        {/* Header with Logo */}
        <div className="flex items-start gap-4 mb-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${org.name} logo`}
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                {org.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Heading variant="small" className="line-clamp-1 mb-0.5">
              {org.name}
            </Heading>
            <Text variant="small" className="text-muted-foreground">
              {org.total_projects} projects
            </Text>
          </div>
        </div>

        {/* Description */}
        <Text variant="muted" className="line-clamp-3 mb-4 flex-1 text-sm">
          {org.description}
        </Text>

        {/* Years Section */}
        {org.active_years && org.active_years.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {org.active_years
                .sort((a, b) => b - a)
                .slice(0, 5)
                .map((year) => (
                  <Badge
                    key={year}
                    variant="outline"
                    className="text-xs bg-teal-50 text-teal-700 border-teal-200"
                  >
                    {year}
                  </Badge>
                ))}
              {org.active_years.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{org.active_years.length - 5}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Technologies Section */}
        {org.technologies && org.technologies.length > 0 && (
          <div className="mb-3">
            <Text variant="small" className="text-muted-foreground mb-1.5 text-xs font-medium">
              Tech Stack
            </Text>
            <div className="flex flex-wrap items-center gap-1.5">
              {org.technologies.slice(0, 4).map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="text-xs"
                >
                  {tech}
                </Badge>
              ))}
              {org.technologies.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{org.technologies.length - 4}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t mt-auto">
          <Badge variant="secondary" className="text-xs">
            {org.category}
          </Badge>
          <Badge variant={org.is_currently_active ? "default" : "outline"} className="text-xs">
            {org.is_currently_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardWrapper>
    </Link>
  );
}

