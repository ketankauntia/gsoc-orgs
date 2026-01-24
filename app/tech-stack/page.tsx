import Link from "next/link";
import { Search, TrendingUp, BarChart3, Users, Rocket, ArrowUpDown } from "lucide-react";
import {
  SectionHeader,
  Grid,
  CardWrapper,
  Heading,
  Text,
} from "@/components/ui";
import { loadTechStackIndexData, TechStackIndexData, TechSummary } from "@/lib/tech-stack-page-types";
import { TechStackClientWrapper } from "./tech-stack-client-wrapper";
import { StackPopularityChart, TopStacksChart, MostSelectionsChart, MostProjectsChart, PopularityGrowthChart } from "./charts";

// Static Generation - cache forever, NO dynamic behavior
export const revalidate = false;
export const dynamic = 'force-static';

export const metadata = {
  title: "Technologies & Programming Languages | GSoC Organizations",
  description: "Explore Google Summer of Code organizations and projects by programming language and technology. Find opportunities that match your technical expertise.",
};

export default async function TechStackPage() {
  // Load static data - SINGLE JSON READ, NO RUNTIME AGGREGATION
  const data = await loadTechStackIndexData();

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Text className="text-destructive">Failed to load tech stack data</Text>
      </div>
    );
  }

  return (
    <div className="space-y-12">
          
          {/* Page Header */}
          <SectionHeader
            badge="Browse by Technology"
            title="Programming Languages & Technologies"
            description={`Explore ${data.metrics.total_organizations} Google Summer of Code organizations across ${data.metrics.total_technologies} technologies. Find opportunities that match your technical expertise.`}
            align="center"
            className="max-w-3xl mx-auto"
          />

          {/* Analytics Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              <Heading variant="subsection">Technology Analytics</Heading>
            </div>

            {/* First Row: 2 Charts */}
            <Grid cols={{ default: 1, lg: 2 }} gap="lg">
              {/* Stack Popularity Over Years */}
              <CardWrapper className="p-6">
                <div className="mb-4">
                  <Heading variant="small" className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    Stack Popularity Over the Years
                  </Heading>
                  <Text variant="small" className="text-muted-foreground mt-1">
                    Organization adoption trends - select technologies to compare
                  </Text>
                </div>
                <StackPopularityChart 
                  data={data.charts.popularity_by_year} 
                  availableTechs={data.charts.top_tech_by_orgs.map(t => ({
                    name: t.label,
                    slug: t.slug || t.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    count: t.value
                  }))}
                />
              </CardWrapper>

              {/* Top Tech Stacks */}
              <CardWrapper className="p-6">
                <div className="mb-4">
                  <Heading variant="small" className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-600" />
                    Top Tech Stacks by Org Count
                  </Heading>
                  <Text variant="small" className="text-muted-foreground mt-1">
                    Most popular technologies in GSoC
                  </Text>
                </div>
                <TopStacksChart data={data.charts.top_tech_by_orgs.map(t => ({
                  name: t.label,
                  slug: t.slug,
                  count: t.value
                }))} />
              </CardWrapper>
            </Grid>

            {/* Second Row: 2 Charts */}
            <Grid cols={{ default: 1, lg: 2 }} gap="lg">
              {/* Most Selections */}
              <CardWrapper className="p-6">
                <div className="mb-4">
                  <Heading variant="small" className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    Tech Stacks with Most Selections
                  </Heading>
                  <Text variant="small" className="text-muted-foreground mt-1">
                    2025-2020 - Organizations selected by technology
                  </Text>
                </div>
                <MostSelectionsChart data={data.charts.most_selections} />
              </CardWrapper>

              {/* Most Projects */}
              <CardWrapper className="p-6">
                <div className="mb-4">
                  <Heading variant="small" className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-600" />
                    Tech Stacks with Most Projects
                  </Heading>
                  <Text variant="small" className="text-muted-foreground mt-1">
                    2025-2020 - Total projects by technology
                  </Text>
                </div>
                <MostProjectsChart data={data.charts.most_projects} />
              </CardWrapper>
            </Grid>

            {/* Third Row: Growth Chart */}
            <CardWrapper className="p-6">
              <div className="mb-4">
                <Heading variant="small" className="text-base flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-teal-600" />
                  Tech Stacks with Highest Growth in Popularity
                </Heading>
                <Text variant="small" className="text-muted-foreground mt-1">
                  2025-2020 - Shows % growth and total projects allocated
                </Text>
              </div>
              <PopularityGrowthChart data={data.charts.fastest_growing.map(t => ({
                name: t.name,
                percentIncrease: t.growth_pct,
                total: 0, // Not used in chart
                firstYear: t.first_year_count,
                lastYear: t.last_year_count,
                byYear: []
              }))} />
            </CardWrapper>
          </section>

          {/* All Tech Stacks - Client-side search/sort */}
          <TechStackClientWrapper techs={data.all_techs} />

        </div>
  );
}
