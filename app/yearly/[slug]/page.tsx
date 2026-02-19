import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  Users,
  ArrowRight,
  Sparkles,
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
import { Header } from "@/components/header";
import { Footer } from "@/components/Footer";
import { loadYearlyPageData } from "@/lib/yearly-page-types";
import { getFullUrl } from "@/lib/constants";
import { getAvailableProjectYears } from "@/lib/projects-page-types";
import { ExpandableOrgList, ExpandableProjectList, MentorsContributorsTable } from "./client-components";
import {
  StudentSlotsBarChart,
  LanguagesBarChart,
  OrganizationsProjectsChart,
  SimpleSelectionChart,
} from "../../[slug]/year-charts";

// Static Generation - cache forever
export const revalidate = false;

// Derived from the single source of truth in getAvailableProjectYears().
// Adding a year there auto-updates yearly pages, project pages, and sitemap.
export async function generateStaticParams() {
  return getAvailableProjectYears().map(year => ({
    slug: `google-summer-of-code-${year}`,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  
  // Load data from static JSON (cached at build time)
  const data = await loadYearlyPageData(slug);
  
  if (!data) {
    return {
      title: "GSoC Organizations | Google Summer of Code",
      description: "Explore organizations participating in Google Summer of Code.",
    };
  }
  
  const { title, description } = data;
  const canonicalUrl = getFullUrl(`/yearly/${slug}`);
  
  return {
    title: `${title} | GSoC Organizations Guide`,
    description,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "GSoC Organizations Guide",
      images: [
        {
          url: getFullUrl("/og/gsoc-organizations-guide.jpg"),
          width: 1200,
          height: 630,
          alt: "GSoC Organizations Guide",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [getFullUrl("/og/gsoc-organizations-guide.jpg")],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function YearlyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Load data from static JSON
  const data = await loadYearlyPageData(slug);

  if (!data) {
    notFound();
  }

  const { year, metrics, organizations, charts, first_time_orgs, insights } = data;

  // Determine page context
  const currentYear = new Date().getFullYear();
  const isUpcoming = year > currentYear;
  const isPast = year < currentYear;

  return (
    <>
      <Header />
      <div className="w-full pt-16">
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
              title={data.title}
              description={data.description}
              align="center"
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatCard
                label="Organizations"
                value={metrics.total_organizations}
                subtitle={`${metrics.returning_organizations} veterans`}
              />
              <StatCard
                label="New Orgs"
                value={metrics.first_time_organizations}
                subtitle={`${Math.round((metrics.first_time_organizations / metrics.total_organizations) * 100)}% of total`}
              />
              <StatCard
                label="Total Projects"
                value={metrics.total_projects}
                subtitle={`~${metrics.avg_projects_per_org} avg/org`}
              />
              <StatCard
                label="Participants"
                value={metrics.total_participants}
                subtitle={`~${metrics.avg_participants_per_org} per org`}
              />
              <StatCard
                label="Mentors"
                value={metrics.total_mentors}
                subtitle={`~${metrics.avg_mentors_per_org} per org`}
              />
              <StatCard
                label="Countries"
                value={metrics.countries_participated ?? "N/A"}
                subtitle={metrics.countries_participated ? "Participating" : "Data unavailable"}
              />
              <StatCard
                label="Top Language"
                value={charts.top_languages[0]?.label || "N/A"}
                subtitle="Most projects"
              />
               <StatCard
                label="Edition"
                value={`#${year - 2005 + 1}`}
                subtitle={`Year ${year}`}
              />
            </div>
          </div>

          {/* Charts Section */}
          <div className="space-y-8">
            <Heading variant="subsection" className="text-center">
              <Sparkles className="w-5 h-5 inline mr-2" />
              {year} Year Insights & Statistics
            </Heading>

            {/* Top Charts Grid */}
            <Grid cols={{ default: 1, lg: 2 }} gap="lg">
              {/* Chart 1: Top Programming Languages */}
              <LanguagesBarChart 
                data={charts.top_languages.slice(0, 10).map((l) => ({
                  language: l.label,
                  count: l.value,
                  percentage: Math.round((l.value / metrics.total_organizations) * 100)
                }))} 
              />

              {/* Chart 2: Top Organizations by Student Slots */}
              <StudentSlotsBarChart 
                data={charts.most_student_slots.slice(0, 10).map((o) => ({
                  org: o.label,
                  slots: o.value
                }))}
                year={year.toString()}
              />
            </Grid>

            {/* Difficulty and Projects Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Difficulty Distribution - Pie Chart Matches Reference */}
              <CardWrapper className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Heading variant="small" className="text-lg">
                        Project Difficulty Distribution
                      </Heading>
                      <Text variant="muted" className="text-sm mt-1">
                        Breakdown of project difficulty levels
                      </Text>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {metrics.total_projects} total projects
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-48 h-48">
                      <div
                        className="w-full h-full rounded-full"
                        style={{
                          background: `conic-gradient(
                            from 0deg,
                            #0d9488 0% ${charts.project_difficulty_distribution.data.find(d => d.label === "Beginner")?.percentage || 0}%,
                            #14b8a6 ${charts.project_difficulty_distribution.data.find(d => d.label === "Beginner")?.percentage || 0}% ${(charts.project_difficulty_distribution.data.find(d => d.label === "Beginner")?.percentage || 0) + (charts.project_difficulty_distribution.data.find(d => d.label === "Intermediate")?.percentage || 0)}%,
                            #2dd4bf ${(charts.project_difficulty_distribution.data.find(d => d.label === "Beginner")?.percentage || 0) + (charts.project_difficulty_distribution.data.find(d => d.label === "Intermediate")?.percentage || 0)}% 100%
                          )`,
                        }}
                      />
                      <div className="absolute inset-[30%] bg-background rounded-full flex items-center justify-center">
                        <div className="text-center">
                          <Text className="text-2xl font-bold">{metrics.total_organizations}</Text>
                          <Text variant="small" className="text-muted-foreground">orgs</Text>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      {charts.project_difficulty_distribution.data.map((diff: { label: string; value: number; percentage?: number }) => {
                        const tealColors = ["#0d9488", "#14b8a6", "#2dd4bf"];
                        // Map labels to match colors if order is guaranteed, typically Beginner/Intermediate/Advanced
                        // Our JSON has "Beginner", "Intermediate", "Advanced"
                        const colorIndex = diff.label === "Beginner" ? 0 : diff.label === "Intermediate" ? 1 : 2;
                        
                        // We need to calculate percentage if it's missing or 0 in JSON (script sets 0 for beginner/advanced currently, need to rely on what's there)
                        const percentage = diff.percentage || Math.round((diff.value / metrics.total_projects) * 100) || 0;

                        return (
                          <div key={diff.label} className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-sm"
                              style={{ backgroundColor: tealColors[colorIndex] }}
                            />
                            <Text variant="small">
                              {diff.label}: {diff.value} ({percentage}%)
                            </Text>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardWrapper>

              {/* Organizations with Most Projects */}
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
                    data={charts.orgs_with_most_projects.slice(0, 10).map((org: { label: string; value: number }) => ({
                      name: org.label,
                      projects: org.value
                    }))}
                  />
                </div>
              </CardWrapper>
            </div>

            {/* Highest Selections */}
            <ChartCard
              title={`Highest Selections in GSoC ${year}`}
              description="Top selections by tech stack and organization"
            >
              <Grid cols={{ default: 1, md: 2 }} gap="lg">
                <CardWrapper padding="md" className="border-0 shadow-none ring-0">
                  <Text className="font-semibold mb-3 text-lg">By Tech Stack</Text>
                  <SimpleSelectionChart 
                    data={charts.highest_selections.by_tech_stack.map((item: { label: string; value: number }) => ({
                      name: item.label,
                      count: item.value
                    }))}
                  />
                </CardWrapper>

                <CardWrapper padding="md" className="border-0 shadow-none ring-0">
                  <Text className="font-semibold mb-3 text-lg">By Organization</Text>
                  <SimpleSelectionChart 
                    data={charts.highest_selections.by_organization.map((item: { label: string; value: number }) => ({
                      name: item.label,
                      count: item.value
                    }))}
                  />
                </CardWrapper>
              </Grid>
            </ChartCard>
          </div>

          {/* First-Time Organizations */}
          <CardWrapper className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Heading variant="small" className="text-lg">
                    First-Time Organizations
                  </Heading>
                  <Text variant="muted" className="text-sm mt-1">
                    Organizations that joined GSoC for the first time in {year}
                  </Text>
                </div>
                <Badge variant="secondary">
                  {metrics.first_time_organizations} New
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {first_time_orgs.map((org: { slug: string; logo_url?: string; name: string }) => (
                  <Link key={org.slug} href={`/organizations/${org.slug}`}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all py-2 px-3"
                    >
                      {org.logo_url && (
                        <Image
                          src={org.logo_url}
                          alt={org.name}
                          width={16}
                          height={16}
                          className="w-4 h-4 mr-2 rounded"
                          unoptimized
                        />
                      )}
                      {org.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </CardWrapper>

          {/* All Organizations Preview */}
          <CardWrapper className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Heading variant="small" className="text-lg">
                    Organizations
                  </Heading>
                  <Text variant="muted" className="text-sm mt-1">
                    All {metrics.total_organizations} organizations participating in GSoC {year}
                  </Text>
                </div>
              </div>
              <ExpandableOrgList organizations={organizations} />
            </div>
          </CardWrapper>
          
          {/* Projects List */}
           <CardWrapper className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Heading variant="small" className="text-lg">
                    Projects
                  </Heading>
                  <Text variant="muted" className="text-sm mt-1">
                    All {metrics.total_projects} projects in GSoC {year}
                  </Text>
                </div>
              </div>
              <ExpandableProjectList projects={data.projects} />
            </div>
          </CardWrapper>

          {/* Mentors & Contributors Section */}
          <CardWrapper className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Heading variant="small" className="text-lg">
                    Mentors & Contributors
                  </Heading>
                  <Text variant="muted" className="text-sm mt-1">
                    Community members participating in GSoC {year}
                  </Text>
                </div>
                <Badge variant="secondary">
                   {metrics.total_mentors} Mentors • {metrics.total_participants} Contributors
                </Badge>
              </div>
              
              <MentorsContributorsTable 
                data={data.projects.map(p => ({
                   org_name: organizations.find(o => o.slug === p.org_slug)?.name || p.org_slug,
                   org_slug: p.org_slug,
                   mentors: p.mentors || [],
                   contributors: p.contributor ? [p.contributor] : []
                }))} 
              />
            </div>
          </CardWrapper>

          {/* Insights Section */}
          {insights && (
            <CardWrapper className="p-6">
              <div className="space-y-4">
                <Heading variant="small" className="text-lg">
                  Key Insights
                </Heading>
                <Grid cols={{ default: 1, md: 3 }} gap="md">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <Text className="font-semibold mb-2">Fastest Growing Tech</Text>
                    {insights.fastest_growing_tech.slice(0, 3).map((tech) => (
                      <div key={tech.slug} className="flex justify-between text-sm py-1">
                        <span className="capitalize">{tech.slug}</span>
                        <Badge variant="secondary">+{tech.growth_pct}%</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <Text className="font-semibold mb-2">Notable First-Time Orgs</Text>
                    {insights.notable_first_time_orgs.map((org) => (
                      <div key={org.slug} className="text-sm py-1">
                        <span className="font-medium capitalize">{org.slug.replace(/-/g, ' ')}</span>
                        <Text variant="small" className="text-muted-foreground block">{org.reason}</Text>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <Text className="font-semibold mb-2">Top Orgs by Projects</Text>
                    {insights.top_orgs_by_projects.map((org) => (
                      <div key={org.slug} className="flex justify-between text-sm py-1">
                        <span>{org.name}</span>
                        <Badge variant="outline">{org.project_count}</Badge>
                      </div>
                    ))}
                  </div>
                </Grid>
              </div>
            </CardWrapper>
          )}

          {/* Footer CTA */}
          <div className="text-center space-y-4 py-10 border-t">
            <Heading variant="subsection">
              Looking for more?
            </Heading>
            <Text className="max-w-2xl mx-auto text-muted-foreground">
              Explore organizations from other years or browse by topics and tech stacks.
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
      <Footer />
    </>
  );
}

// --- Helper Components ---

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <Text variant="small" className="text-muted-foreground mb-2">
        {label}
      </Text>
      <Text className="text-3xl font-bold mb-1">{value}</Text>
      <Text variant="small" className="text-muted-foreground">
        {subtitle}
      </Text>
    </div>
  );
}

function ChartCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <CardWrapper className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Heading variant="small" className="text-lg flex items-center gap-2">
              {icon}
              {title}
            </Heading>
            {description && (
              <Text variant="muted" className="text-sm mt-1">
                {description}
              </Text>
            )}
          </div>
        </div>
        {children}
      </div>
    </CardWrapper>
  );
}

