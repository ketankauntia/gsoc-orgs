"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Users, Code, Calendar } from "lucide-react";
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
import { TopicPageData } from "@/lib/topics-page-types";
import { OrganizationCard } from "@/components/organization-card";

interface TopicPageClientProps {
  topic: TopicPageData;
}

export function TopicPageClient({ topic }: TopicPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");

  // Filter organizations - memoized to prevent unnecessary recalculations
  const filteredOrgs = useMemo(() => {
    let filtered = topic.organizations;

    // Search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (org) =>
          org.name.toLowerCase().includes(searchLower) ||
          org.slug.toLowerCase().includes(searchLower)
      );
    }

    // Year filter
    if (selectedYear !== "all") {
      filtered = filtered.filter((org) =>
        org.active_years.includes(selectedYear) && !org.withdrawn_years?.includes(selectedYear)
      );
    }

    return filtered;
  }, [topic.organizations, searchQuery, selectedYear]);

  // Get available years from topic data
  const availableYears = topic.years.sort((a, b) => b - a);

  return (
    <div className="space-y-12">
      {/* Topic Header */}
      <section>
        <div className="mb-4">
          <Badge variant="outline" className="mb-3">
            Topic
          </Badge>
        </div>
        <SectionHeader
          titleAs="h1"
          title={topic.name}
          description={`Explore ${topic.organizationCount} organizations working on ${topic.name} with ${topic.projectCount} total projects across ${topic.years.length} years.`}
          align="left"
        />

        {/* Quick Stats Bar */}
        <div className="mt-8 flex flex-wrap items-center gap-8 p-6 rounded-xl bg-muted/50 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Text variant="small" className="text-muted-foreground">
                Organizations
              </Text>
              <Heading variant="small">{topic.organizationCount}</Heading>
            </div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Code className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Text variant="small" className="text-muted-foreground">
                Total Projects
              </Text>
              <Heading variant="small">{topic.projectCount}</Heading>
            </div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Text variant="small" className="text-muted-foreground">
                Active Years
              </Text>
              <Heading variant="small">{topic.years.length}</Heading>
            </div>
          </div>
        </div>
      </section>

      {/* Yearly Stats */}
      {Object.keys(topic.yearlyStats).length > 0 && (
        <section>
          <Heading variant="section" className="mb-6">
            Yearly Statistics
          </Heading>
          <CardWrapper>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(topic.yearlyStats)
                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                .map(([year, stats]) => (
                  <div key={year} className="text-center p-4 rounded-lg bg-muted/50">
                    <Text variant="small" className="text-muted-foreground mb-1">
                      {year}
                    </Text>
                    <Heading variant="small" className="mb-1">
                      {stats.organizationCount}
                    </Heading>
                    <Text variant="small" className="text-xs text-muted-foreground">
                      {stats.projectCount} projects
                    </Text>
                  </div>
                ))}
            </div>
          </CardWrapper>
        </section>
      )}

      {/* Search & Filters */}
      <section>
        <Heading variant="section" className="mb-6">
          Organizations
        </Heading>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search organizations by name..."
              className="pl-10 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Year Filter */}
        {availableYears.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedYear === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedYear("all")}
            >
              All Years
            </Button>
            {availableYears.map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            ))}
          </div>
        )}

        {/* Results Count */}
        <Text variant="small" className="text-muted-foreground mb-4">
          Showing {filteredOrgs.length} of {topic.organizationCount} organization
          {topic.organizationCount !== 1 ? "s" : ""}
        </Text>

        {/* Organizations Grid */}
        {filteredOrgs.length === 0 ? (
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
            {filteredOrgs.map((org) => {
              // Convert topic org format to OrganizationCard format
              const orgForCard = {
                id: org.slug,
                slug: org.slug,
                name: org.name,
                description: "",
                category: "",
                image_url: "",
                img_r2_url: undefined,
                logo_r2_url: undefined,
                url: "",
                active_years: org.active_years,
                first_year: org.first_year,
                last_year: org.last_year,
                is_currently_active: org.is_currently_active,
                technologies: [],
                topics: [],
                total_projects: org.total_projects,
              };
              return (
                <OrganizationCard key={org.slug} org={orgForCard} />
              );
            })}
          </Grid>
        )}
      </section>

      {/* CTA Section */}
      <section className="text-center py-12">
        <Heading variant="section" className="mb-4">
          Can&apos;t find what you&apos;re looking for?
        </Heading>
        <Text className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Explore all organizations or browse other topics to find the perfect
          GSoC project for you.
        </Text>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button size="lg" asChild>
            <Link href="/organizations" prefetch={true}>
              View All Organizations
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/topics" prefetch={true}>
              Browse Topics
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
