"use client";

import { useState, useMemo } from "react";
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
import type { TechStackPageData, TechOrgSnapshot } from "@/lib/tech-stack-page-types";

interface TechStackDetailClientProps {
  data: TechStackPageData;
}

type SortOption = "name" | "projects-desc" | "projects-asc" | "year-desc";

export function TechStackDetailClient({ data }: TechStackDetailClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("projects-desc");

  // Filter and sort organizations - CLIENT-SIDE ONLY
  const filteredOrgs = useMemo(() => {
    let result = [...data.organizations];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(query) ||
          o.category.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "projects-desc":
        result.sort((a, b) => b.total_projects - a.total_projects);
        break;
      case "projects-asc":
        result.sort((a, b) => a.total_projects - b.total_projects);
        break;
      case "year-desc":
        result.sort((a, b) => {
          const aMax = Math.max(...(a.active_years || [0]));
          const bMax = Math.max(...(b.active_years || [0]));
          return bMax - aMax;
        });
        break;
    }

    return result;
  }, [data.organizations, searchQuery, sortBy]);

  // Teal color palette for charts
  const TEAL_COLORS = ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4"];

  return (
    <div className="space-y-12">
      {/* Header */}
      <SectionHeader
        badge="Technology"
        title={data.name}
        description={`${data.metrics.org_count} organization${data.metrics.org_count !== 1 ? "s" : ""} using ${data.name} with ${data.metrics.project_count} total projects`}
        align="center"
        className="max-w-3xl mx-auto"
      />

      {/* Stats Cards */}
      <section>
        <Grid cols={{ default: 2, md: 4 }} gap="md">
          <CardWrapper className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-5 h-5 text-teal-600" />
              <Text variant="small" className="text-muted-foreground">
                Organizations
              </Text>
            </div>
            <Heading variant="small">{data.metrics.org_count}</Heading>
          </CardWrapper>
          <CardWrapper className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Code className="w-5 h-5 text-teal-600" />
              <Text variant="small" className="text-muted-foreground">
                Total Projects
              </Text>
            </div>
            <Heading variant="small">{data.metrics.project_count.toLocaleString()}</Heading>
          </CardWrapper>
          <CardWrapper className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <Text variant="small" className="text-muted-foreground">
                Avg/Org
              </Text>
            </div>
            <Heading variant="small">{data.metrics.avg_projects_per_org}</Heading>
          </CardWrapper>
          <CardWrapper className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              <Text variant="small" className="text-muted-foreground">
                Years Active
              </Text>
            </div>
            <Heading variant="small">{data.metrics.first_year_used} - {data.metrics.latest_year_used}</Heading>
          </CardWrapper>
        </Grid>
      </section>

      {/* Charts - NO API CALLS, pre-computed data */}
      <section>
        <Heading variant="section" className="mb-6">
          {data.name} Analytics
        </Heading>
        <Grid cols={{ default: 1, lg: 2 }} gap="lg">
          {/* Organization Growth Trend */}
          <CardWrapper className="p-6">
            <div className="mb-4">
              <Heading variant="small" className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Organization Adoption Over Years
              </Heading>
              <Text variant="small" className="text-muted-foreground mt-1">
                Number of GSoC organizations using {data.name}
              </Text>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.charts.popularity_by_year}>
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
                    dataKey="org_count"
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
                Projects by Year
              </Heading>
              <Text variant="small" className="text-muted-foreground mt-1">
                Total projects using {data.name} each year
              </Text>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.popularity_by_year}>
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
                  <Bar dataKey="project_count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {data.charts.popularity_by_year.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={TEAL_COLORS[index % TEAL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardWrapper>
        </Grid>
      </section>

      {/* Organizations Section */}
      <section>
        <div className="text-center mb-6">
          <Heading variant="section">
            GSoC Organizations Using {data.name}
          </Heading>
        </div>

        {/* Sort Controls */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <Text variant="small" className="text-muted-foreground">Sort:</Text>
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

        {/* Search Bar */}
        <div className="mb-6 flex justify-center">
          <div className="relative max-w-2xl w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search organizations..."
              className="pl-10 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Organizations Grid */}
        {filteredOrgs.length === 0 ? (
          <CardWrapper className="text-center py-12">
            <Heading variant="small" className="mb-2">
              No organizations found
            </Heading>
            <Text className="text-muted-foreground">
              Try adjusting your search
            </Text>
          </CardWrapper>
        ) : (
          <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
            {filteredOrgs.map((org) => (
              <OrganizationCard key={org.slug} org={org} />
            ))}
          </Grid>
        )}
      </section>

      {/* CTA */}
      <section className="text-center">
        <Button size="lg" asChild>
          <Link href="/tech-stack" prefetch={true}>
            View All Technologies
          </Link>
        </Button>
      </section>
    </div>
  );
}

/**
 * Organization Card Component
 */
function OrganizationCard({ org }: { org: TechOrgSnapshot }) {
  return (
    <Link href={`/organizations/${org.slug}`} prefetch={true}>
      <CardWrapper hover className="h-full flex flex-col">
        {/* Header with Logo */}
        <div className="flex items-start gap-4 mb-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {org.logo_url ? (
              <Image
                src={org.logo_url}
                alt={`${org.name} logo`}
                width={48}
                height={48}
                className="w-full h-full object-contain"
                unoptimized={true}
                loading="lazy"
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
