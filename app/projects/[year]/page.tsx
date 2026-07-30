import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Code2,
  Users,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Calendar,
} from "lucide-react";
import {
  Container,
  Button,
  Badge,
  Grid,
  CardWrapper,
  Heading,
  Text,
} from "@/components/ui";
import { Header } from "@/components/header";
import { Footer } from "@/components/Footer";
import { ArchiveYearHero } from "@/components/archive-year-hero";
import { OrganizationLogo } from "@/components/organization-logo";
import { loadProjectsYearData, getAvailableProjectYears } from "@/lib/projects-page-types";
import { ExpandableProjectList } from "./client-components";
import {
  LanguagesBarChart,
  OrganizationsProjectsChart,
} from "../../[slug]/year-charts";
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs";

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
          <SiteBreadcrumbs
            items={[
              { label: "Projects", href: "/projects" },
              { label: `GSoC ${year}`, href: `/projects/${year}` },
            ]}
          />

          {/* 1️⃣ Hero / Summary Block */}
          <ArchiveYearHero
            context="Project archive"
            year={year}
            title={data.title}
            description={data.description}
            publishedAt={data.published_at}
            finalized={data.finalized}
            metrics={[
              {
                value: metrics.total_projects.toLocaleString(),
                label: "Recorded projects",
                note: "Accepted archive records",
              },
              {
                value: metrics.total_organizations,
                label: "Organizations",
                note: "Represented in this project archive",
              },
              {
                value: metrics.avg_projects_per_org,
                label: "Average projects per org",
                note: "Calculated from recorded projects",
              },
              {
                value: metrics.first_time_org_projects,
                label: "Projects from first-time orgs",
                note: `${insights.first_time_org_percentage}% of organizations first appear this year`,
              },
            ]}
          />

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
              </div>
            </div>
          </CardWrapper>

          {/* 3️⃣ Charts Section */}
          <div className="deferred-section space-y-8">
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
                        className="cursor-pointer py-2 px-3 transition-[background-color,color,border-color] hover:border-foreground/30 hover:bg-muted"
                      >
                        <OrganizationLogo
                          src={org.logo_url}
                          name={org.name}
                          size={18}
                          className="mr-1.5 rounded-md"
                        />
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
