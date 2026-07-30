import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  GitCompareArrows,
  Network,
  TrendingUp,
} from "lucide-react";
import {
  Heading,
  MetricCell,
  PageRail,
  SourceNote,
  Text,
} from "@/components/ui";
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs";
import { loadTechStackIndexData } from "@/lib/tech-stack-page-types";
import { TechStackClientWrapper } from "./tech-stack-client-wrapper";
import {
  MostProjectsChart,
  MostSelectionsChart,
  PopularityGrowthChart,
  StackPopularityChart,
  TopStacksChart,
} from "./charts";

// Static Generation - cache forever, NO dynamic behavior
export const revalidate = false;
export const dynamic = "force-static";

export const metadata = {
  title: "Technologies & Programming Languages | GSoC Organizations",
  description:
    "Browse technologies recorded across Google Summer of Code organizations and projects. Compare organization coverage, project totals, and yearly archive trends.",
};

function formatSnapshotDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function getYearRange(years: number[]) {
  if (years.length === 0) return "No years recorded";
  if (years.length === 1) return String(years[0]);
  return `${years[0]}–${years[years.length - 1]}`;
}

interface ChartPanelProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

function ChartPanel({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
  className,
}: ChartPanelProps) {
  return (
    <article className={`min-w-0 bg-card p-5 sm:p-7 ${className ?? ""}`}>
      <div className="mb-7 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon aria-hidden="true" className="size-4" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className="font-data text-[10px] uppercase tracking-[0.16em] text-accent-foreground">
            {eyebrow}
          </p>
          <Heading as="h3" variant="small" className="mt-2">
            {title}
          </Heading>
          <Text variant="small" className="mt-2 max-w-xl text-muted-foreground">
            {description}
          </Text>
        </div>
      </div>
      {children}
    </article>
  );
}

export default async function TechStackPage() {
  // Load static data - SINGLE JSON READ, NO RUNTIME AGGREGATION
  const data = await loadTechStackIndexData();

  if (!data) {
    return (
      <div
        className="atlas-corner-marks flex min-h-[28rem] items-center justify-center border border-border bg-card p-8 text-center"
        role="alert"
      >
        <div>
          <Heading as="h1" variant="subsection">
            Technology data is unavailable.
          </Heading>
          <Text className="mt-4 text-muted-foreground">
            The generated technology index could not be loaded.
          </Text>
        </div>
      </div>
    );
  }

  const trendYears = Array.from(
    new Set(
      Object.values(data.charts.popularity_by_year).flatMap((series) =>
        series.map((point) => point.year),
      ),
    ),
  ).sort((a, b) => a - b);
  const recentYears = trendYears.slice(-6);
  const snapshotDate = formatSnapshotDate(data.published_at);
  const archiveYearRange = getYearRange(trendYears);
  const recentYearRange = getYearRange(recentYears);
  const comparisonStartYear = recentYears[0] ?? trendYears[0] ?? 0;
  const comparisonEndYear =
    recentYears[recentYears.length - 1] ??
    trendYears[trendYears.length - 1] ??
    comparisonStartYear;

  return (
    <div>
      <SiteBreadcrumbs
        items={[{ label: "Tech Stack", href: "/tech-stack" }]}
        className="pb-6 pt-1"
      />

      <PageRail className="px-0" innerClassName="max-w-none px-0">
        <section
          aria-labelledby="technology-page-title"
          className="relative overflow-hidden rounded-[1.5rem] bg-ink text-[#f5eee9]"
        >
          <div aria-hidden="true" className="atlas-grid absolute inset-0 opacity-20" />
          <div className="relative px-6 py-12 sm:px-9 sm:py-16 lg:px-12 lg:py-20">
            <p className="font-data text-[10px] uppercase tracking-[0.18em] text-primary">
              Technology atlas · generated archive index
            </p>
            <h1
              id="technology-page-title"
              className="mt-5 max-w-4xl text-balance text-[clamp(2.25rem,5vw,4.75rem)] font-medium leading-[0.98] tracking-[-0.045em] text-[#f5eee9]"
            >
              See which technologies recur across GSoC.
            </h1>
            <Text
              variant="lead"
              className="mt-6 max-w-2xl text-[#aaa29d]"
            >
              Compare recorded organization coverage, project totals, and
              yearly counts before opening a technology page.
            </Text>
            <SourceNote
              inverse
              className="mt-8"
              date={snapshotDate}
            />
          </div>

          <div className="relative grid border-t border-white/15 sm:grid-cols-3">
            <MetricCell
              inverse
              className="border-b border-white/15 sm:border-b-0 sm:border-r"
              value={data.metrics.total_technologies.toLocaleString()}
              label="Technology labels"
              note="Distinct labels in this index"
            />
            <MetricCell
              inverse
              className="border-b border-white/15 sm:border-b-0 sm:border-r"
              value={data.metrics.total_organizations.toLocaleString()}
              label="Organizations"
              note="Unique organizations represented"
            />
            <MetricCell
              inverse
              value={archiveYearRange}
              label="Recorded years"
              note={`${trendYears.length.toLocaleString()} archive editions`}
            />
          </div>
        </section>

        <section
          aria-labelledby="technology-evidence-title"
          className="deferred-section border-x border-border px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.6fr)] lg:items-end">
            <div>
              <p className="font-data text-[10px] uppercase tracking-[0.18em] text-accent-foreground">
                Archive evidence
              </p>
              <h2
                id="technology-evidence-title"
                className="mt-4 max-w-3xl text-balance text-[clamp(1.75rem,3vw,3rem)] font-medium leading-[1.02] tracking-[-0.035em]"
              >
                Read the technology index from more than one angle.
              </h2>
            </div>
            <div>
              <Text className="text-muted-foreground">
                Organization totals show breadth. Project totals and yearly
                series add context, but they do not measure applicant demand
                or selection probability.
              </Text>
              <SourceNote className="mt-5" date={snapshotDate} />
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid lg:grid-cols-2">
              <ChartPanel
                className="border-b border-border lg:border-r"
                eyebrow="Yearly series"
                title="Organization counts by year"
                description={`Compare selected technology labels across ${archiveYearRange}. Add or remove series to focus the chart.`}
                icon={GitCompareArrows}
              >
                <StackPopularityChart
                  data={data.charts.popularity_by_year}
                  availableTechs={data.charts.top_tech_by_orgs.map((item) => ({
                    name: item.label,
                    slug:
                      item.slug ??
                      item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  }))}
                />
              </ChartPanel>

              <ChartPanel
                className="border-b border-border"
                eyebrow="Organization coverage"
                title="Technology labels with the widest coverage"
                description="Top technology labels ranked by the number of distinct organizations in this snapshot."
                icon={Network}
              >
                <TopStacksChart
                  data={data.charts.top_tech_by_orgs
                    .filter((item) => item.slug !== undefined)
                    .map((item) => ({
                      name: item.label,
                      slug: item.slug!,
                      count: item.value,
                    }))}
                />
              </ChartPanel>
            </div>

            <div className="grid lg:grid-cols-2">
              <ChartPanel
                className="border-b border-border lg:border-r"
                eyebrow="Distinct organizations"
                title="Organization coverage by technology"
                description={`Distinct organizations for the leading technology labels, with yearly counts for ${recentYearRange}.`}
                icon={Network}
              >
                <MostSelectionsChart data={data.charts.most_selections} />
              </ChartPanel>

              <ChartPanel
                className="border-b border-border"
                eyebrow="Recorded projects"
                title="Project totals by technology"
                description={`Recorded project totals for the leading technology labels. The accompanying series covers ${recentYearRange}.`}
                icon={BarChart3}
              >
                <MostProjectsChart data={data.charts.most_projects} />
              </ChartPanel>
            </div>

            <ChartPanel
              eyebrow="Relative change"
              title="Change in recorded organization coverage"
              description={`Percentage change between ${comparisonStartYear} and ${comparisonEndYear}, alongside the organization count at each endpoint.`}
              icon={TrendingUp}
            >
              <PopularityGrowthChart
                comparisonEndYear={comparisonEndYear}
                comparisonStartYear={comparisonStartYear}
                data={data.charts.fastest_growing.map((item) => ({
                  name: item.name,
                  percentIncrease: item.growth_pct,
                  firstYearCount: item.first_year_count,
                  lastYearCount: item.last_year_count,
                }))}
              />
            </ChartPanel>
          </div>
        </section>

        <section
          aria-label="Technology directory"
          className="border-x border-t border-border px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
        >
          <TechStackClientWrapper techs={data.all_techs} />
        </section>
      </PageRail>
    </div>
  );
}
