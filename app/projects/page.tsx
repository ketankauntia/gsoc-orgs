import Link from "next/link";
import { Code2, Calendar, ArrowRight, TrendingUp, Building2 } from "lucide-react";
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
import { getAvailableProjectYears, loadProjectsYearData } from "@/lib/projects-page-types";

// Static Generation - cache forever
export const revalidate = false;

export const metadata = {
  title: "GSoC Projects by Year",
  description: "Explore Google Summer of Code projects by year. Browse historical project data from 2016 to 2025.",
};

export default async function ProjectsIndexPage() {
  // Load summary data for each year - at BUILD TIME only
  const years = getAvailableProjectYears();
  const yearData = await Promise.all(
    years.map(async (year) => {
      const data = await loadProjectsYearData(year);
      return {
        year,
        total_projects: data?.metrics.total_projects || 0,
        total_organizations: data?.metrics.total_organizations || 0,
        top_org: data?.insights.top_org?.name || null,
        top_tech: data?.insights.top_tech?.name || null,
      };
    })
  );

  // Calculate totals
  const totalProjects = yearData.reduce((sum, y) => sum + y.total_projects, 0);
  const totalOrgAppearances = yearData.reduce((sum, y) => sum + y.total_organizations, 0);

  return (
    <>
      <Header />
      <div className="w-full pt-16">
      <Container size="default" className="py-8 lg:py-16">
        <div className="space-y-12 lg:space-y-16">

          {/* Hero Section */}
          <div className="space-y-6">
            <SectionHeader
              badge="GSoC Projects"
              title="Google Summer of Code Projects"
              description="Explore all GSoC projects from 2016 to 2025. Browse by year to see accepted projects, participating organizations, and technology trends."
              align="center"
            />

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <StatCard
                icon={<Code2 className="w-5 h-5 text-primary" />}
                label="Total Projects"
                value={totalProjects.toLocaleString()}
              />
              <StatCard
                icon={<Building2 className="w-5 h-5 text-primary" />}
                label="Organization Appearances"
                value={totalOrgAppearances.toLocaleString()}
              />
              <StatCard
                icon={<Calendar className="w-5 h-5 text-primary" />}
                label="Years Covered"
                value={years.length}
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5 text-primary" />}
                label="Latest Year"
                value="2025"
              />
            </div>
          </div>

          {/* Years Grid */}
          <div className="space-y-6">
            <Heading variant="subsection" className="text-center">
              Browse by Year
            </Heading>

            <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="md">
              {yearData.reverse().map((data) => (
                <Link key={data.year} href={`/projects/${data.year}`}>
                  <CardWrapper className="p-6 h-full hover:border-primary transition-colors cursor-pointer group">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                          {data.year}
                        </Badge>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Text variant="small" className="text-muted-foreground">Projects</Text>
                          <Text className="font-semibold">{data.total_projects.toLocaleString()}</Text>
                        </div>
                        <div className="flex justify-between">
                          <Text variant="small" className="text-muted-foreground">Organizations</Text>
                          <Text className="font-semibold">{data.total_organizations}</Text>
                        </div>
                        {data.top_org && (
                          <div className="pt-2 border-t">
                            <Text variant="small" className="text-muted-foreground">
                              Top Org: <span className="text-foreground">{data.top_org}</span>
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardWrapper>
                </Link>
              ))}
            </Grid>
          </div>

          {/* CTA Section */}
          <div className="text-center space-y-4 py-10 border-t">
            <Heading variant="subsection">
              Looking for specific projects?
            </Heading>
            <Text className="max-w-2xl mx-auto text-muted-foreground">
              Choose a year above to explore all accepted projects, or browse by organization or technology.
            </Text>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <Button asChild size="lg">
                <Link href="/projects/2025">
                  <Calendar className="w-4 h-4 mr-2" />
                  View 2025 Projects
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/organizations">
                  <Building2 className="w-4 h-4 mr-2" />
                  Browse Organizations
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

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="p-4 rounded-lg border bg-card text-center">
      <div className="flex justify-center mb-2">
        {icon}
      </div>
      <Text className="text-2xl font-bold">{value}</Text>
      <Text variant="small" className="text-muted-foreground">
        {label}
      </Text>
    </div>
  );
}
