"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, TrendingUp, Users, Code, Calendar, ArrowRight, Tag } from "lucide-react";
import {
  Heading,
  Text,
  Badge,
  Button,
  CardWrapper,
  Grid,
  Input,
} from "@/components/ui";

interface TechStack {
  slug: string;
  name: string;
  description: string;
  color: string;
  totalOrgs: number;
  totalProjects: number;
  activeYears: number[];
  relatedTopics: string[];
}

interface Organization {
  slug: string;
  name: string;
  logo: string | null;
  description: string;
  techStack: string[];
  yearsActive: number[];
  projectCount: number;
  difficulty: string;
}

interface TechStackPageClientProps {
  stack: TechStack;
  organizations: Organization[];
}

export function TechStackPageClient({ stack, organizations }: TechStackPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  // Filter organizations
  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesYear =
      selectedYear === "all" || org.yearsActive.includes(selectedYear);
    
    const matchesDifficulty =
      selectedDifficulty === "all" || org.difficulty === selectedDifficulty;

    return matchesSearch && matchesYear && matchesDifficulty;
  });

  // Calculate stats for charts - using fixed mock data for stable rendering
  const yearCounts = stack.activeYears.map((year, index) => ({
    year,
    count: 8 + index * 3, // Mock data: growing trend
  }));

  const difficultyStats = [
    { level: "Beginner Friendly", count: 25, percentage: 37 },
    { level: "Intermediate", count: 28, percentage: 41 },
    { level: "All Levels", count: 15, percentage: 22 },
  ];

  return (
    <div className="space-y-12">
      {/* Tech Stack Header */}
      <section>
        <div className="mb-4">
          <Badge variant="outline" className="mb-3">
            Technology
          </Badge>
        </div>
        
        {/* Stack Name with Color Badge */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
            style={{ backgroundColor: stack.color }}
          >
            {stack.name.charAt(0)}
          </div>
          <div>
            <Heading variant="section">{stack.name}</Heading>
          </div>
        </div>

        <Text variant="lead" className="text-muted-foreground max-w-3xl">
          {stack.description}
        </Text>

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
              <Heading variant="small">{stack.totalOrgs}</Heading>
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
              <Heading variant="small">{stack.totalProjects}</Heading>
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
              <Heading variant="small">{stack.activeYears.length}</Heading>
            </div>
          </div>
        </div>

        {/* Related Topics */}
        {stack.relatedTopics && stack.relatedTopics.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <Text variant="small" className="text-muted-foreground font-medium">
                Related Topics:
              </Text>
            </div>
            <div className="flex flex-wrap gap-2">
              {stack.relatedTopics.map((topic) => (
                <Badge key={topic} variant="secondary">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Analytics Charts */}
      <section>
        <Heading variant="section" className="mb-6">
          {stack.name} Analytics
        </Heading>
        <Grid cols={{ default: 1, lg: 2 }} gap="lg">
          {/* Organization Growth Trend */}
          <CardWrapper>
            <Heading variant="small" className="mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Organizations Growth Trend
            </Heading>
            <div className="h-48">
              <svg className="w-full h-full" viewBox="0 0 300 150">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1="30"
                    y1={130 - i * 25}
                    x2="280"
                    y2={130 - i * 25}
                    stroke="currentColor"
                    strokeOpacity="0.1"
                  />
                ))}
                
                {/* Y-axis labels */}
                {[0, 5, 10, 15, 20].map((val, i) => (
                  <text
                    key={i}
                    x="10"
                    y={135 - i * 25}
                    className="text-xs fill-muted-foreground"
                  >
                    {val}
                  </text>
                ))}

                {/* Line */}
                <polyline
                  points={yearCounts
                    .map((d, i) => `${50 + i * 50},${130 - (d.count / 20) * 100}`)
                    .join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary"
                />

                {/* Points */}
                {yearCounts.map((d, i) => (
                  <circle
                    key={i}
                    cx={50 + i * 50}
                    cy={130 - (d.count / 20) * 100}
                    r="4"
                    className="fill-primary"
                  />
                ))}

                {/* X-axis labels */}
                {yearCounts.map((d, i) => (
                  <text
                    key={i}
                    x={40 + i * 50}
                    y="145"
                    className="text-xs fill-muted-foreground"
                  >
                    {d.year}
                  </text>
                ))}
              </svg>
            </div>
            <Text variant="small" className="text-muted-foreground mt-2 text-center">
              Consistent growth in {stack.name} adoption
            </Text>
          </CardWrapper>

          {/* Difficulty Distribution */}
          <CardWrapper>
            <Heading variant="small" className="mb-4">
              Difficulty Distribution
            </Heading>
            <div className="space-y-4 mt-6">
              {difficultyStats.map((stat) => (
                <div key={stat.level}>
                  <div className="flex items-center justify-between mb-2">
                    <Text variant="small">{stat.level}</Text>
                    <Text variant="small" className="text-muted-foreground">
                      {stat.count} orgs ({stat.percentage}%)
                    </Text>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Text variant="small" className="text-muted-foreground mt-4 text-center">
              {difficultyStats[0].percentage}% of projects are beginner-friendly
            </Text>
          </CardWrapper>
        </Grid>
      </section>

      {/* Search & Filters */}
      <section>
        <Heading variant="section" className="mb-6">
          Organizations Using {stack.name}
        </Heading>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search organizations by name or description..."
              className="pl-10 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Year Filter */}
          <div className="flex gap-2">
            <Button
              variant={selectedYear === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedYear("all")}
            >
              All Years
            </Button>
            {stack.activeYears.map((year) => (
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

          <div className="hidden sm:block w-px h-8 bg-border" />

          {/* Difficulty Filter */}
          <div className="flex gap-2">
            <Button
              variant={selectedDifficulty === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDifficulty("all")}
            >
              All Levels
            </Button>
            <Button
              variant={selectedDifficulty === "Beginner Friendly" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDifficulty("Beginner Friendly")}
            >
              Beginner
            </Button>
            <Button
              variant={selectedDifficulty === "Intermediate" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDifficulty("Intermediate")}
            >
              Intermediate
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <Text variant="small" className="text-muted-foreground mb-4">
          Showing {filteredOrgs.length} organization{filteredOrgs.length !== 1 ? "s" : ""}
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
            {filteredOrgs.map((org) => (
              <CardWrapper key={org.slug} hover className="flex flex-col h-full">
                {/* Logo/Icon */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border">
                    {org.logo ? (
                      <Image
                        src={org.logo}
                        alt={org.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-muted-foreground">
                        {org.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Heading variant="small" className="line-clamp-1">
                      {org.name}
                    </Heading>
                    <Text variant="small" className="text-muted-foreground">
                      {org.projectCount} projects
                    </Text>
                  </div>
                </div>

                {/* Description */}
                <Text variant="muted" className="line-clamp-3 mb-4 flex-1">
                  {org.description}
                </Text>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {org.techStack.slice(0, 3).map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {org.techStack.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{org.techStack.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Badge variant="outline">{org.difficulty}</Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/organizations/${org.slug}`}>
                      View Details <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardWrapper>
            ))}
          </Grid>
        )}
      </section>

      {/* CTA Section */}
      <section className="text-center py-12">
        <Heading variant="section" className="mb-4">
          Want to explore other technologies?
        </Heading>
        <Text className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Browse all programming languages and technologies to find GSoC projects that match your skills.
        </Text>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button size="lg" asChild>
            <Link href="/tech-stack">View All Technologies</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/organizations">Browse All Organizations</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

