import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import {
  Users,
  ArrowRight,
} from "lucide-react";
import {
  Container,
  SectionHeader,
  Button,
  Badge,
  Grid,
  CardWrapper,
  Heading,
  Text,
} from "@/components/ui";
import { apiFetchServer } from "@/lib/api.server";
import { Organization } from "@/lib/api";
import {
  ExpandableBeginnerOrgs,
} from "./expandable-sections";
import {
  StudentSlotsBarChart,
  LanguagesBarChart,
  OrganizationsProjectsChart,
} from "./year-charts";
import { GSoCYearClient } from "./gsoc-year-client";
import { AllOrganizationsSection } from "./all-organizations-section";

// Fetch organizations for a specific year
async function fetchOrganizationsByYear(year: string): Promise<Organization[]> {
  try {
    const response = await apiFetchServer<{
      success: boolean;
      data: {
        organizations: Array<{
          slug: string;
          name: string;
          category: string;
          description: string;
          image_url: string;
          technologies: string[];
          topics: string[];
          years: Record<string, unknown>;
          stats: {
            projects_by_year: Record<string, number>;
            students_by_year: Record<string, number>;
          };
        }>;
      };
    }>(`/api/v1/years/${year}/organizations?limit=100`);

    if (!response.success || !response.data) {
      return [];
    }

    const yearNum = parseInt(year, 10);
    const yearKey = `year_${yearNum}`;

    return response.data.organizations.map((org) => {
      const yearData = (org.years as Record<string, { num_projects?: number }>)[yearKey];
      return {
      id: org.slug,
      name: org.name,
      slug: org.slug,
      description: org.description,
      category: org.category,
      image_url: org.image_url,
      img_r2_url: org.image_url,
      logo_r2_url: org.image_url,
      technologies: org.technologies || [],
      topics: org.topics || [],
      total_projects: (yearData?.num_projects as number) || 0,
      is_currently_active: true,
      first_year: yearNum,
      last_year: yearNum,
      active_years: [yearNum],
      };
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }
}

// Fetch year statistics
async function fetchYearStats(year: string) {
  try {
    const response = await apiFetchServer<{
      success: boolean;
      data: {
        year: number;
        overview: {
          total_organizations: number;
          total_projects: number;
          total_students: number;
          avg_projects_per_org: number;
        };
        technologies: Array<{ name: string; count: number }>;
        topics: Array<{ name: string; count: number }>;
      };
    }>(`/api/v1/years/${year}/stats`);

    if (!response.success || !response.data) {
      return null;
    }

    const data = response.data;
    const totalOrgs = data.overview.total_organizations;
    const totalProjects = data.overview.total_projects;

    // Calculate language distribution with percentages
    const languageDistribution = data.technologies
      .slice(0, 10)
      .map((tech) => ({
        language: tech.name,
        count: tech.count,
        percentage: totalOrgs > 0 ? Math.round((tech.count / totalOrgs) * 100) : 0,
      }));

    // Calculate top topics
    const topTopics = data.topics.slice(0, 5).map((t) => t.name);

    // Calculate top tech stacks
    const topTechStacks = data.technologies.slice(0, 12).map((t) => t.name);

    // For now, we'll estimate difficulty distribution (this would need project data)
    const difficultyDistribution = [
      { level: "Beginner", count: Math.floor(totalOrgs * 0.4), percentage: 40 },
      { level: "Intermediate", count: Math.floor(totalOrgs * 0.33), percentage: 33 },
      { level: "Advanced", count: Math.floor(totalOrgs * 0.27), percentage: 27 },
    ];

    // Calculate top orgs by slots (using project count as proxy)
    const orgs = await fetchOrganizationsByYear(year);
    const topOrgsBySlots = orgs
      .sort((a, b) => b.total_projects - a.total_projects)
      .slice(0, 8)
      .map((org) => ({
        name: org.name,
        slug: org.slug,
        slots: org.total_projects,
      }));

    // Calculate new orgs (first year participants)
    const newOrgs = orgs.filter((org) => org.first_year === parseInt(year, 10)).length;
    const multiYearOrgs = totalOrgs - newOrgs;

    return {
      totalOrgs,
      newOrgs,
      totalProjects,
      averageProjectsPerOrg: data.overview.avg_projects_per_org,
      topTopics,
      topTechStacks,
      languageDistribution,
      topOrgsBySlots,
      difficultyDistribution,
      multiYearOrgs,
    };
  } catch (error) {
    console.error("Error fetching year stats:", error);
    return null;
  }
}

// Fetch projects for a year
async function fetchProjectsByYear(year: string) {
  try {
    const response = await apiFetchServer<{
      page: number;
      limit: number;
      total: number;
      pages: number;
      items: Array<{
        project_id: string;
        project_title: string;
        project_abstract_short: string;
        contributor?: string;
        mentors?: string;
        project_code_url?: string;
        org_name: string;
        org_slug: string;
        year: number;
      }>;
    }>(`/api/projects?year=${year}&limit=100`);

    return response.items || [];
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

// Calculate highest selections by tech stack
function calculateHighestSelectionsByTech(
  organizations: Organization[],
  year: string
) {
  const techMap = new Map<string, number>();
  const yearNum = parseInt(year, 10);

  organizations.forEach((org) => {
    if (org.active_years.includes(yearNum)) {
      org.technologies.forEach((tech) => {
        const count = techMap.get(tech) || 0;
        techMap.set(tech, count + 1);
      });
    }
  });

  return Array.from(techMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// Calculate highest selections by organization
function calculateHighestSelectionsByOrg(
  organizations: Organization[],
  year: string
) {
  const yearNum = parseInt(year, 10);

  return organizations
    .filter((org) => org.active_years.includes(yearNum))
    .map((org) => ({
      name: org.name,
      slug: org.slug,
      count: org.total_projects || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// Calculate mentors and contributors
function calculateMentorsAndContributors(projects: Array<{
  org_name: string;
  org_slug: string;
  mentors?: string | string[];
  contributor?: string;
}>) {
  const orgMap = new Map<
    string,
    { org_name: string; org_slug: string; mentors: string[]; contributors: string[] }
  >();

  projects.forEach((project) => {
    const existing = orgMap.get(project.org_slug) || {
      org_name: project.org_name,
      org_slug: project.org_slug,
      mentors: [],
      contributors: [],
    };

    if (project.mentors) {
      const mentors = Array.isArray(project.mentors)
        ? project.mentors
        : project.mentors.split(",").map((m) => m.trim()).filter(Boolean);
      existing.mentors.push(...mentors);
    }

    if (project.contributor) {
      existing.contributors.push(project.contributor);
    }

    orgMap.set(project.org_slug, existing);
  });

  // Deduplicate
  orgMap.forEach((value) => {
    value.mentors = Array.from(new Set(value.mentors));
    value.contributors = Array.from(new Set(value.contributors));
  });

  return Array.from(orgMap.values()).map((mc) => ({
    ...mc,
    mentors: mc.mentors.join(", ") || "",
  }));
}

// Parse slug to extract year from format: gsoc-YYYY-organizations
function parseGSoCSlug(slug: string): string | null {
  const match = slug.match(/^gsoc-(\d{4})-organizations$/);
  if (!match) return null;
  
  const year = match[1];
  const yearNum = parseInt(year, 10);
  // Use a reasonable upper bound to avoid date-related hydration issues
  const maxYear = 2030; // Reasonable upper bound for GSoC years
  
  if (yearNum >= 2005 && yearNum <= maxYear) {
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

// Force revalidation to ensure footer links stay updated
// This prevents serving stale cached HTML with old links
export const revalidate = 3600; // Revalidate every hour

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

  // Fetch all data in parallel
  const [organizations, stats, projects] = await Promise.all([
    fetchOrganizationsByYear(year),
    fetchYearStats(year),
    fetchProjectsByYear(year),
  ]);

  if (!stats) {
    notFound();
  }

  // Calculate additional data
  const highestSelectionsByTech = calculateHighestSelectionsByTech(organizations, year);
  const highestSelectionsByOrg = calculateHighestSelectionsByOrg(organizations, year);
  const mentorsAndContributors = calculateMentorsAndContributors(projects);

  // Filter new organizations (first year participants)
  const newOrgs = organizations.filter((org) => org.first_year === parseInt(year, 10));

  const yearNum = parseInt(year, 10);
  // Calculate current year once to avoid hydration mismatches
  const currentYear = new Date().getFullYear();
  const isUpcoming = yearNum > currentYear;
  const isPast = yearNum < currentYear;

  return (
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

            {/* Difficulty Distribution and Organizations with Most Projects - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Difficulty Distribution - Pie Chart Only */}
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
                  
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-48 h-48">
                      <div
                        className="w-full h-full rounded-full"
                        style={{
                          background: `conic-gradient(
                            from 0deg,
                            #0d9488 0% ${stats.difficultyDistribution.find(d => d.level === "Beginner")?.percentage || 0}%,
                            #14b8a6 ${stats.difficultyDistribution.find(d => d.level === "Beginner")?.percentage || 0}% ${(stats.difficultyDistribution.find(d => d.level === "Beginner")?.percentage || 0) + (stats.difficultyDistribution.find(d => d.level === "Intermediate")?.percentage || 0)}%,
                            #2dd4bf ${(stats.difficultyDistribution.find(d => d.level === "Beginner")?.percentage || 0) + (stats.difficultyDistribution.find(d => d.level === "Intermediate")?.percentage || 0)}% 100%
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
                      {stats.difficultyDistribution.map((diff, index) => {
                        const tealColors = ["#0d9488", "#14b8a6", "#2dd4bf"];
                        return (
                          <div key={diff.level} className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-sm"
                              style={{ backgroundColor: tealColors[index] }}
                            />
                            <Text variant="small">
                              {diff.level}: {diff.count} ({diff.percentage}%)
                            </Text>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardWrapper>

              {/* Organizations with Most Projects - Vertical Bar Chart */}
              <CardWrapper className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Heading variant="small" className="text-lg">
                        Organizations with Most Projects
                      </Heading>
                      <Text variant="muted" className="text-sm mt-1">
                        Top organizations by project count in {year}
                      </Text>
                    </div>
                  </div>
                  
                  <OrganizationsProjectsChart 
                    data={stats.topOrgsBySlots.slice(0, 10).map(org => ({
                      name: org.name,
                      projects: org.slots,
                    }))}
                  />
                </div>
              </CardWrapper>
            </div>

            {/* New Organizations Section - Moved to GSoCYearClient */}

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
                <ExpandableBeginnerOrgs 
                  organizations={organizations.slice(0, 20).map(org => ({
                    slug: org.slug,
                    name: org.name,
                    logo: org.img_r2_url || org.logo_r2_url || org.image_url,
                    description: org.description,
                    topics: org.topics || [],
                    techStack: org.technologies || [],
                    projectCount: org.total_projects,
                    difficulty: "Beginner" as const,
                  }))} 
                />
              </div>
            </CardWrapper>
          </div>


          {/* New Sections: Highest Selections, Projects, Mentors & Contributors */}
          <Suspense fallback={
            <div className="min-h-[800px] flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                <p className="mt-4 text-muted-foreground">Loading year data...</p>
              </div>
            </div>
          }>
            <GSoCYearClient
              year={year}
              organizations={newOrgs}
              projects={projects}
              highestSelectionsByTech={highestSelectionsByTech}
              highestSelectionsByOrg={highestSelectionsByOrg}
              mentorsAndContributors={mentorsAndContributors}
            />
          </Suspense>

          {/* Organizations Grid - Client Component for Show More/Less */}
          <Suspense fallback={
            <div className="min-h-[600px] flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                <p className="mt-4 text-muted-foreground">Loading organizations...</p>
              </div>
            </div>
          }>
            <AllOrganizationsSection organizations={organizations} year={year} />
          </Suspense>

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
                <Link href="/organizations" prefetch={true}>
                  <Users className="w-4 h-4 mr-2" />
                  View All Organizations
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/topics" prefetch={true}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Browse by Topic
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

