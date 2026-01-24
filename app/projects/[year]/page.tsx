import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Code2,
  Users,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Building2,
  Calendar,
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
import { loadProjectsYearData, getAvailableProjectYears } from "@/lib/projects-page-types";
import { ExpandableProjectList } from "./client-components";
import {
  LanguagesBarChart,
  OrganizationsProjectsChart,
} from "../../[slug]/year-charts";

// Static Generation - cache forever
export const revalidate = false;

// Generate static params for all known years
export async function generateStaticParams() {
  return getAvailableProjectYears().map((year) => ({
    year: year.toString(),
  }));
}

// Metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const data = await loadProjectsYearData(parseInt(year));
  
  if (!data) {
    return { title: "Projects Not Found" };
  }

  return {
    title: data.title,
    description: data.description,
    openGraph: {
      title: data.title,
      description: data.description,
    },
  };
}

export default async function ProjectsYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr);

  // Load data from static JSON - SINGLE FILE READ, NO AGGREGATION
  const data = await loadProjectsYearData(year);

  if (!data) {
    notFound();
  }

  const { metrics, projects, charts, insights, first_time_orgs } = data;

  return (
    <>
      <Header />
      <div className="w-full pt-16">
      <Container size="default" className="py-8 lg:py-16">
        <div className="space-y-12 lg:space-y-16">

          {/* 1️⃣ Hero / Summary Block */}
          <div className="space-y-6">
            <SectionHeader
              badge={`GSoC ${year}`}
              title={data.title}
              description={data.description}
              align="center"
            />

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Code2 className="w-5 h-5 text-primary" />}
                label="Total Projects"
                value={metrics.total_projects}
                subtitle="accepted"
              />
              <StatCard
                icon={<Building2 className="w-5 h-5 text-primary" />}
                label="Organizations"
                value={metrics.total_organizations}
                subtitle="participating"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5 text-primary" />}
                label="Avg Projects/Org"
                value={metrics.avg_projects_per_org}
                subtitle="per organization"
              />
              <StatCard
                icon={<Sparkles className="w-5 h-5 text-primary" />}
                label="First-Time Org Projects"
                value={metrics.first_time_org_projects}
                subtitle={`${insights.first_time_org_percentage}% of orgs are new`}
              />
            </div>
          </div>

          {/* 2️⃣ Key Insights Block */}
          <CardWrapper className="p-6 bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="space-y-4">
              <Heading variant="small" className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Key Insights for GSoC {year}
              </Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.top_org && (
                  <InsightCard
                    title="Top Organization"
                    content={`${insights.top_org.name} led with ${insights.top_org.count} projects`}
                  />
                )}
                {insights.top_tech && (
                  <InsightCard
                    title="Most Used Technology"
                    content={`${insights.top_tech.name} was used by ${insights.top_tech.percentage}% of organizations`}
                  />
                )}
                <InsightCard
                  title="First-Time Organizations"
                  content={`${insights.first_time_org_percentage}% of organizations joined GSoC for the first time`}
                />
                {insights.avg_tech_stack_size && (
                  <InsightCard
                    title="Tech Stack Complexity"
                    content={`Average project used ${insights.avg_tech_stack_size} core technologies`}
                  />
                )}
                {insights.difficulty_summary && (
                  <InsightCard
                    title="Project Difficulty"
                    content={insights.difficulty_summary}
                  />
                )}
              </div>
            </div>
          </CardWrapper>

          {/* 3️⃣ Charts Section */}
          <div className="space-y-8">
            <Heading variant="subsection" className="text-center">
              <TrendingUp className="w-5 h-5 inline mr-2" />
              {year} Statistics & Trends
            </Heading>

            <Grid cols={{ default: 1, lg: 2 }} gap="lg">
              {/* Top Technologies Chart */}
              <LanguagesBarChart 
                data={charts.top_technologies.slice(0, 10).map((t) => ({
                  language: t.label,
                  count: t.value,
                  percentage: t.percentage || Math.round((t.value / metrics.total_organizations) * 100)
                }))} 
              />

              {/* Top Organizations by Project Count */}
              <CardWrapper className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Heading variant="small" className="text-lg">
                        Top Organizations by Projects
                      </Heading>
                      <Text variant="muted" className="text-sm mt-1">
                        Organizations with most accepted projects
                      </Text>
                    </div>
                  </div>
                  
                  <OrganizationsProjectsChart 
                    data={charts.orgs_with_most_projects.slice(0, 10).map((org) => ({
                      name: org.label,
                      projects: org.value
                    }))}
                  />
                </div>
              </CardWrapper>
            </Grid>

            {/* Difficulty Distribution */}
            {charts.project_difficulty_distribution && (
              <CardWrapper className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Heading variant="small" className="text-lg">
                        Project Difficulty Distribution
                      </Heading>
                      <Text variant="muted" className="text-sm mt-1">
                        Breakdown of project difficulty levels in {year}
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
                          <Text className="text-2xl font-bold">{metrics.total_projects}</Text>
                          <Text variant="small" className="text-muted-foreground">projects</Text>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      {charts.project_difficulty_distribution.data.map((diff, index) => {
                        const tealColors = ["#0d9488", "#14b8a6", "#2dd4bf"];
                        const colorIndex = diff.label === "Beginner" ? 0 : diff.label === "Intermediate" ? 1 : 2;
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
            )}
          </div>

          {/* 4️⃣ First-Time Organizations Section */}
          {first_time_orgs.length > 0 && (
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
                    {first_time_orgs.length} New
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {first_time_orgs.map((org) => (
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
                        <span className="ml-1 text-muted-foreground">
                          ({org.project_count})
                        </span>
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </CardWrapper>
          )}

          {/* 5️⃣ Project List (Main Content) */}
          <CardWrapper className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Heading variant="small" className="text-lg">
                    All Projects
                  </Heading>
                  <Text variant="muted" className="text-sm mt-1">
                    {metrics.total_projects} projects from GSoC {year}
                  </Text>
                </div>
              </div>
              {/* Client-side search and filter - NO DB QUERIES */}
              <ExpandableProjectList projects={projects} />
            </div>
          </CardWrapper>

          {/* 6️⃣ Footer / Navigation */}
          <div className="text-center space-y-4 py-10 border-t">
            <Heading variant="subsection">
              Explore More
            </Heading>
            <Text className="max-w-2xl mx-auto text-muted-foreground">
              Browse projects from other years or explore organizations and technologies.
            </Text>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <Button asChild size="lg">
                <Link href="/organizations">
                  <Users className="w-4 h-4 mr-2" />
                  View Organizations
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/tech-stack">
                  <Code2 className="w-4 h-4 mr-2" />
                  Browse Tech Stack
                </Link>
              </Button>
              {year > 2016 && (
                <Button asChild size="lg" variant="ghost">
                  <Link href={`/projects/${year - 1}`}>
                    <Calendar className="w-4 h-4 mr-2" />
                    GSoC {year - 1}
                  </Link>
                </Button>
              )}
              {year < 2025 && (
                <Button asChild size="lg" variant="ghost">
                  <Link href={`/projects/${year + 1}`}>
                    GSoC {year + 1}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}
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
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <Text variant="small" className="text-muted-foreground">
          {label}
        </Text>
      </div>
      <Text className="text-3xl font-bold mb-1">{value}</Text>
      <Text variant="small" className="text-muted-foreground">
        {subtitle}
      </Text>
    </div>
  );
}

function InsightCard({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-background/50 border">
      <Text className="font-semibold text-sm mb-1">{title}</Text>
      <Text variant="small" className="text-muted-foreground">{content}</Text>
    </div>
  );
}
