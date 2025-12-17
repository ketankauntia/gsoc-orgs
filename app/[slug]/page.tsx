import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  Users,
  Code,
  ArrowRight,
} from "lucide-react";
import {
  Container,
  SectionHeader,
  Input,
  Button,
  Badge,
  Grid,
  CardWrapper,
  Heading,
  Text,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  ExpandableNewOrgs,
  ExpandableBeginnerOrgs,
  ExpandableTechStacks,
} from "./expandable-sections";
import {
  StudentSlotsBarChart,
  LanguagesBarChart,
} from "./year-charts";

// Types
interface Organization {
  slug: string;
  name: string;
  logo: string;
  description: string;
  topics: string[];
  techStack: string[];
  projectCount: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  isNew?: boolean;
}

interface YearStats {
  totalOrgs: number;
  newOrgs: number;
  totalProjects: number;
  averageProjectsPerOrg: number;
  topTopics: string[];
  topTechStacks: string[];
  languageDistribution: { language: string; count: number; percentage: number }[];
  topOrgsBySlots: { name: string; slug: string; slots: number }[];
  difficultyDistribution: { level: string; count: number; percentage: number }[];
  multiYearOrgs: number;
}

// MOCK DATA - Replace with actual DB queries
async function fetchOrganizationsByYear(year: string): Promise<Organization[]> {
  // TODO: Filter organizations by year from database
  void year;
  
  await new Promise((resolve) => setTimeout(resolve, 100));

  const allOrgs: Organization[] = [
    {
      slug: "python-software-foundation",
      name: "Python Software Foundation",
      logo: "https://via.placeholder.com/150",
      description: "The Python Software Foundation manages the development of the Python programming language.",
      topics: ["Programming Languages", "Web Development"],
      techStack: ["Python", "C", "JavaScript"],
      projectCount: 8,
      difficulty: "Intermediate",
      isNew: false,
    },
    {
      slug: "apache-software-foundation",
      name: "Apache Software Foundation",
      logo: "https://via.placeholder.com/150",
      description: "Home to open-source software projects under the Apache license.",
      topics: ["Web Development", "Cloud Computing"],
      techStack: ["Java", "Python", "Go"],
      projectCount: 12,
      difficulty: "Advanced",
      isNew: false,
    },
    {
      slug: "mozilla",
      name: "Mozilla",
      logo: "https://via.placeholder.com/150",
      description: "Mozilla is the organization behind Firefox and advocates for an open, accessible web.",
      topics: ["Web Development", "Security"],
      techStack: ["JavaScript", "Rust", "C++"],
      projectCount: 6,
      difficulty: "Intermediate",
      isNew: true,
    },
    {
      slug: "wikimedia-foundation",
      name: "Wikimedia Foundation",
      logo: "https://via.placeholder.com/150",
      description: "The organization behind Wikipedia and its sister projects.",
      topics: ["Education", "Web Development"],
      techStack: ["PHP", "JavaScript", "Python"],
      projectCount: 10,
      difficulty: "Beginner",
      isNew: false,
    },
    {
      slug: "debian",
      name: "Debian",
      logo: "https://via.placeholder.com/150",
      description: "A free operating system composed entirely of free and open-source software.",
      topics: ["Operating Systems", "System Administration"],
      techStack: ["C", "Python", "Shell"],
      projectCount: 7,
      difficulty: "Advanced",
      isNew: false,
    },
    {
      slug: "cncf",
      name: "Cloud Native Computing Foundation",
      logo: "https://via.placeholder.com/150",
      description: "CNCF hosts critical components of the global technology infrastructure.",
      topics: ["Cloud Computing", "DevOps"],
      techStack: ["Go", "Rust", "Python"],
      projectCount: 15,
      difficulty: "Advanced",
      isNew: true,
    },
  ];

  return allOrgs;
}

async function fetchYearStats(year: string): Promise<YearStats> {
  void year;
  
  return {
    totalOrgs: 45,
    newOrgs: 8,
    totalProjects: 156,
    averageProjectsPerOrg: 3.5,
    topTopics: ["Web Development", "Machine Learning", "Cloud Computing", "DevOps", "Mobile"],
    topTechStacks: ["Python", "JavaScript", "Java", "Go", "C++", "Rust", "TypeScript", "PHP", "Ruby", "C", "Kotlin", "Swift"],
    languageDistribution: [
      { language: "Python", count: 28, percentage: 62 },
      { language: "JavaScript", count: 22, percentage: 49 },
      { language: "Java", count: 18, percentage: 40 },
      { language: "C++", count: 15, percentage: 33 },
      { language: "Go", count: 12, percentage: 27 },
      { language: "Rust", count: 8, percentage: 18 },
      { language: "TypeScript", count: 7, percentage: 16 },
      { language: "PHP", count: 6, percentage: 13 },
      { language: "Ruby", count: 5, percentage: 11 },
      { language: "C", count: 4, percentage: 9 },
    ],
    topOrgsBySlots: [
      { name: "FOSSASIA", slug: "fossasia", slots: 14 },
      { name: "KDE", slug: "kde", slots: 12 },
      { name: "Wikimedia Foundation", slug: "wikimedia-foundation", slots: 10 },
      { name: "Python Software Foundation", slug: "python-software-foundation", slots: 9 },
      { name: "Apache Software Foundation", slug: "apache-software-foundation", slots: 8 },
      { name: "Mozilla", slug: "mozilla", slots: 7 },
      { name: "CNCF", slug: "cncf", slots: 7 },
      { name: "Debian", slug: "debian", slots: 6 },
    ],
    difficultyDistribution: [
      { level: "Beginner", count: 18, percentage: 40 },
      { level: "Intermediate", count: 15, percentage: 33 },
      { level: "Advanced", count: 12, percentage: 27 },
    ],
    multiYearOrgs: 32,
  };
}

// Parse slug to extract year from format: gsoc-YYYY-organizations
function parseGSoCSlug(slug: string): string | null {
  const match = slug.match(/^gsoc-(\d{4})-organizations$/);
  if (!match) return null;
  
  const year = match[1];
  const yearNum = parseInt(year, 10);
  
  if (yearNum >= 2005 && yearNum <= new Date().getFullYear() + 2) {
    return year;
  }
  
  return null;
}

// Generate static params for all GSoC years
export async function generateStaticParams() {
  const currentYear = new Date().getFullYear();
  const slugs = [];
  
  for (let year = 2005; year <= currentYear + 1; year++) {
    slugs.push({ slug: `gsoc-${year}-organizations` });
  }
  
  return slugs;
}

// Organization Card Component
function OrganizationCard({ org }: { org: Organization }) {
  const difficultyColors = {
    Beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    Intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <Link href={`/organizations/${org.slug}`}>
      <CardWrapper className="h-full p-6 hover:scale-[1.02] transition-transform">
        <div className="flex flex-col gap-4 h-full">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg border bg-card flex items-center justify-center shrink-0 overflow-hidden">
              <Image
                src={org.logo}
                alt={`${org.name} logo`}
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <Heading variant="small" className="text-base line-clamp-1">
                  {org.name}
                </Heading>
                {org.isNew && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    New
                  </Badge>
                )}
              </div>
              <Text variant="muted" className="text-xs line-clamp-2 mt-1">
                {org.description}
              </Text>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {org.topics.slice(0, 2).map((topic) => (
              <Badge key={topic} variant="outline" className="text-xs">
                {topic}
              </Badge>
            ))}
            {org.topics.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{org.topics.length - 2}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {org.techStack.slice(0, 3).map((tech) => (
              <Badge
                key={tech}
                className="text-xs bg-primary/10 text-primary hover:bg-primary/20"
              >
                {tech}
              </Badge>
            ))}
            {org.techStack.length > 3 && (
              <Badge className="text-xs bg-primary/10 text-primary">
                +{org.techStack.length - 3}
              </Badge>
            )}
          </div>

          <div className="mt-auto pt-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Code className="w-3.5 h-3.5" />
                <span>{org.projectCount} projects</span>
              </div>
            </div>
            <Badge className={cn("text-xs", difficultyColors[org.difficulty])}>
              {org.difficulty}
            </Badge>
          </div>
        </div>
      </CardWrapper>
    </Link>
  );
}

// Main Page Component
export default async function GSoCYearOrganizationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const year = parseGSoCSlug(slug);
  
  if (!year) {
    notFound();
  }

  const organizations = await fetchOrganizationsByYear(year);
  const stats = await fetchYearStats(year);

  const yearNum = parseInt(year, 10);
  const isUpcoming = yearNum > new Date().getFullYear();
  const isPast = yearNum < new Date().getFullYear();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Google Summer of Code ${year} Organizations`,
    "description": `Complete listing of all ${stats.totalOrgs} organizations participating in Google Summer of Code ${year}`,
    "url": `https://gsoc-orgs.vercel.app/${slug}`,
    "temporalCoverage": year,
    "about": {
      "@type": "Event",
      "name": `Google Summer of Code ${year}`,
      "startDate": `${year}-03-01`,
      "endDate": `${year}-09-30`,
      "eventStatus": isUpcoming ? "https://schema.org/EventScheduled" : "https://schema.org/EventCompleted",
      "description": `Google Summer of Code ${year} program connecting student developers with open-source organizations`,
    },
    "numberOfItems": stats.totalOrgs,
    "itemListElement": organizations.slice(0, 20).map((org, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Organization",
        "name": org.name,
        "url": `https://gsoc-orgs.vercel.app/organizations/${org.slug}`,
        "description": org.description,
        "keywords": [...org.topics, ...org.techStack].join(", "),
        "memberOf": {
          "@type": "Event",
          "name": `Google Summer of Code ${year}`
        }
      }
    })),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": stats.totalOrgs,
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="w-full">
        <Container size="default" className="py-8 lg:py-16">
          <div className="space-y-12 lg:space-y-16">
            {/* Header Section */}
            <div className="space-y-6">
              <SectionHeader
                badge={
                  isUpcoming
                    ? `Upcoming GSoC ${year}`
                    : isPast
                    ? `GSoC ${year} Archive`
                    : `GSoC ${year}`
                }
                title={`Google Summer of Code ${year} Organizations`}
                description={
                  isUpcoming
                    ? `Explore organizations expected to participate in GSoC ${year}. This list will be updated once official announcements are made.`
                    : `Browse all ${stats.totalOrgs} organizations that participated in Google Summer of Code ${year}. ${
                        stats.newOrgs > 0
                          ? `${stats.newOrgs} organizations joined for the first time this year.`
                          : ""
                      }`
                }
                align="center"
              />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <Text variant="small" className="text-muted-foreground mb-2">
                    Organizations
                  </Text>
                  <Text className="text-3xl font-bold mb-1">{stats.totalOrgs}</Text>
                  <Text variant="small" className="text-muted-foreground">
                    {stats.multiYearOrgs} veterans
                  </Text>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <Text variant="small" className="text-muted-foreground mb-2">
                    New Orgs
                  </Text>
                  <Text className="text-3xl font-bold mb-1">{stats.newOrgs}</Text>
                  <Text variant="small" className="text-muted-foreground">
                    {((stats.newOrgs / stats.totalOrgs) * 100).toFixed(0)}% of total
                  </Text>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <Text variant="small" className="text-muted-foreground mb-2">
                    Projects
                  </Text>
                  <Text className="text-3xl font-bold mb-1">{stats.totalProjects}</Text>
                  <Text variant="small" className="text-muted-foreground">
                    ~{stats.averageProjectsPerOrg} avg
                  </Text>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <Text variant="small" className="text-muted-foreground mb-2">
                    Year
                  </Text>
                  <Text className="text-3xl font-bold mb-1">{year}</Text>
                  <Text variant="small" className="text-muted-foreground">
                    Edition #{parseInt(year) - 2005 + 1}
                  </Text>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <Text variant="small" className="text-muted-foreground mb-2">
                    Top Stack
                  </Text>
                  <Text className="text-3xl font-bold mb-1">
                    {stats.languageDistribution[0].language}
                  </Text>
                  <Text variant="small" className="text-muted-foreground">
                    {stats.languageDistribution[0].percentage}% adoption
                  </Text>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <Text variant="small" className="text-muted-foreground mb-2">
                    Beginner Level
                  </Text>
                  <Text className="text-3xl font-bold mb-1">
                    {stats.difficultyDistribution.find((d) => d.level === "Beginner")?.count || 0}
                  </Text>
                  <Text variant="small" className="text-muted-foreground">
                    {stats.difficultyDistribution.find((d) => d.level === "Beginner")?.percentage || 0}% friendly
                  </Text>
                </div>
              </div>
            </div>

            {/* Data Visualizations & Insights */}
            <div className="space-y-8">
              <Heading variant="subsection" className="text-center">
                {year} Year Insights & Statistics
              </Heading>

              {/* Top Charts Grid */}
              <Grid cols={{ default: 1, lg: 2 }} gap="lg">
                {/* Chart 1: Top Programming Languages - Shadcn Bar Chart */}
                <LanguagesBarChart data={stats.languageDistribution} />

                {/* Chart 2: Top Organizations by Student Slots - Shadcn Horizontal Bar Chart */}
                <StudentSlotsBarChart 
                  data={stats.topOrgsBySlots.map(org => ({
                    org: org.name,
                    slots: org.slots,
                  }))}
                  year={year}
                />
              </Grid>

              {/* Difficulty Distribution with Pie Chart */}
              <CardWrapper className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Heading variant="small" className="text-lg">
                        Project Difficulty Distribution
                      </Heading>
                      <Text variant="muted" className="text-sm mt-1">
                        Breakdown of project difficulty levels across all organizations
                      </Text>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {stats.totalProjects} total projects
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Horizontal Bars */}
                    <div className="space-y-4">
                      {stats.difficultyDistribution.map((diff, index) => (
                        <div key={diff.level} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-3 h-3 rounded-sm",
                                index === 0 && "bg-foreground",
                                index === 1 && "bg-foreground/60",
                                index === 2 && "bg-foreground/30"
                              )} />
                              <Text className="font-medium">
                                {diff.level}
                              </Text>
                            </div>
                            <Text className="text-lg font-bold">
                              {diff.percentage}%
                            </Text>
                          </div>
                          <div className="relative h-8 bg-muted rounded-sm overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-500 flex items-center justify-end pr-3",
                                index === 0 && "bg-foreground",
                                index === 1 && "bg-foreground/60",
                                index === 2 && "bg-foreground/30"
                              )}
                              style={{ width: `${diff.percentage}%` }}
                            >
                              <span className="text-xs font-semibold text-background mix-blend-difference">
                                {diff.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Pie Chart */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-48 h-48">
                        <div
                          className="w-full h-full rounded-full"
                          style={{
                            background: `conic-gradient(
                              from 0deg,
                              hsl(var(--foreground)) 0% ${stats.difficultyDistribution[0].percentage}%,
                              hsl(var(--foreground) / 0.6) ${stats.difficultyDistribution[0].percentage}% ${stats.difficultyDistribution[0].percentage + stats.difficultyDistribution[1].percentage}%,
                              hsl(var(--foreground) / 0.3) ${stats.difficultyDistribution[0].percentage + stats.difficultyDistribution[1].percentage}% 100%
                            )`,
                          }}
                        />
                        <div className="absolute inset-[30%] bg-background rounded-full flex items-center justify-center">
                          <div className="text-center">
                            <Text className="text-2xl font-bold">{stats.totalOrgs}</Text>
                            <Text variant="small" className="text-muted-foreground">orgs</Text>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        {stats.difficultyDistribution.map((diff, index) => (
                          <div key={diff.level} className="flex items-center gap-3">
                            <div className={cn(
                              "w-4 h-4 rounded-sm",
                              index === 0 && "bg-foreground",
                              index === 1 && "bg-foreground/60",
                              index === 2 && "bg-foreground/30"
                            )} />
                            <Text variant="small">
                              {diff.level}: {diff.count} ({diff.percentage}%)
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardWrapper>

              {/* New Organizations Section */}
              {stats.newOrgs > 0 && (
                <CardWrapper className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Heading variant="small" className="text-lg">
                          New Organizations in {year}
                        </Heading>
                        <Text variant="muted" className="text-sm mt-1">
                          First-time participants — often have higher acceptance rates
                        </Text>
                      </div>
                      <Badge variant="secondary">
                        {stats.newOrgs} new
                      </Badge>
                    </div>
                    <ExpandableNewOrgs organizations={organizations} year={year} />
                  </div>
                </CardWrapper>
              )}

              {/* Beginner-Friendly Organizations */}
              <CardWrapper className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Heading variant="small" className="text-lg">
                        Beginner-Friendly Organizations
                      </Heading>
                      <Text variant="muted" className="text-sm mt-1">
                        Perfect for first-time GSoC applicants
                      </Text>
                    </div>
                    <Badge variant="secondary">
                      For beginners
                    </Badge>
                  </div>
                  <ExpandableBeginnerOrgs organizations={organizations} />
                </div>
              </CardWrapper>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-col gap-6">
              <div className="relative w-full max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={`Search ${year} organizations...`}
                  className="w-full pl-12 pr-4 py-2 rounded-full h-12 text-base"
                />
              </div>

              <div className="text-center space-y-3">
                <Text variant="small" className="text-muted-foreground">
                  Popular Topics in {year}:
                </Text>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {stats.topTopics.map((topic) => (
                    <Link key={topic} href={`/topics/${topic.toLowerCase().replace(/\s+/g, "-")}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                        {topic}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Organizations by Tech Stack */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Heading variant="subsection">
                  Browse by Programming Language
                </Heading>
                <Text className="text-muted-foreground">
                  Find organizations working with your favorite tech stack
                </Text>
              </div>
              <ExpandableTechStacks techStacks={stats.topTechStacks} organizations={organizations} />
            </div>

            {/* Organizations Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Heading variant="subsection">
                  All Organizations ({organizations.length})
                </Heading>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>

              <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
                {organizations.map((org) => (
                  <OrganizationCard key={org.slug} org={org} />
                ))}
              </Grid>
            </div>

            {/* CTA Section */}
            <div className="text-center space-y-4 py-10 border-t">
              <Heading variant="subsection">
                {isUpcoming
                  ? "Preparing for GSoC?"
                  : "Looking for more information?"}
              </Heading>
              <Text className="max-w-2xl mx-auto text-muted-foreground">
                {isUpcoming
                  ? `Get ready for GSoC ${year} by exploring past organizations, understanding project requirements, and building your skills.`
                  : `Explore organizations from other years or browse by topics and tech stacks to find your perfect match.`}
              </Text>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                <Button asChild size="lg">
                  <Link href="/organizations">
                    <Users className="w-4 h-4 mr-2" />
                    View All Organizations
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/topics">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Browse by Topic
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}

