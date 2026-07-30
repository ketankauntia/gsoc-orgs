"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  Code2,
  Search,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OrganizationLogo } from "@/components/organization-logo";
import {
  Badge,
  Button,
  Input,
  MetricCell,
  PageRail,
  SourceNote,
  Text,
} from "@/components/ui";
import type {
  TechOrgSnapshot,
  TechStackPageData,
} from "@/lib/tech-stack-page-types";
import {
  CHART_AXIS_COLOR,
  CHART_GRID_COLOR,
  CHART_TOOLTIP_STYLE,
} from "../charts/chart-theme";

interface TechStackDetailClientProps {
  data: TechStackPageData;
}

type SortOption = "name" | "projects-desc" | "projects-asc" | "year-desc";

function formatSnapshotDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

interface ChartPanelProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

function ChartPanel({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  className,
}: ChartPanelProps) {
  return (
    <article className={`min-w-0 bg-card p-5 sm:p-7 ${className ?? ""}`}>
      <div className="mb-7 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon aria-hidden="true" className="size-4" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-data text-[10px] uppercase tracking-[0.16em] text-accent-foreground">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold leading-tight tracking-[-0.025em] md:text-2xl">
            {title}
          </h2>
          <Text variant="small" className="mt-2 max-w-xl text-muted-foreground">
            {description}
          </Text>
        </div>
      </div>
      {children}
    </article>
  );
}

export function TechStackDetailClient({ data }: TechStackDetailClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("projects-desc");

  const filteredOrgs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = data.organizations.filter(
      (organization) =>
        !query ||
        organization.name.toLowerCase().includes(query) ||
        organization.category.toLowerCase().includes(query),
    );

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "projects-asc":
          return a.total_projects - b.total_projects;
        case "year-desc":
          return (
            Math.max(...(b.active_years.length ? b.active_years : [0])) -
            Math.max(...(a.active_years.length ? a.active_years : [0]))
          );
        case "projects-desc":
        default:
          return b.total_projects - a.total_projects;
      }
    });
  }, [data.organizations, searchQuery, sortBy]);

  const snapshotDate = formatSnapshotDate(data.published_at);
  const yearRange =
    data.metrics.first_year_used === data.metrics.latest_year_used
      ? String(data.metrics.first_year_used)
      : `${data.metrics.first_year_used}-${data.metrics.latest_year_used}`;
  const hasYearlyData = data.charts.popularity_by_year.length > 0;

  return (
    <PageRail className="px-0" innerClassName="max-w-none px-0">
      <section
        aria-labelledby="technology-detail-title"
        className="relative overflow-hidden rounded-[1.5rem] bg-ink text-[#f5eee9]"
      >
        <div aria-hidden="true" className="atlas-grid absolute inset-0 opacity-20" />
        <div className="relative px-6 py-12 sm:px-9 sm:py-16 lg:px-12 lg:py-20">
          <p className="font-data text-[10px] uppercase tracking-[0.18em] text-primary">
            Technology record
          </p>
          <h1
            id="technology-detail-title"
            className="mt-5 max-w-4xl text-balance text-[clamp(2.75rem,7vw,6.5rem)] font-medium leading-[0.92] tracking-[-0.055em]"
          >
            {data.name}
          </h1>
          <Text variant="lead" className="mt-6 max-w-2xl text-[#aaa29d]">
            Inspect archived organization coverage and project counts for this
            technology label, then open the underlying organization records.
          </Text>
          <SourceNote inverse className="mt-8" date={snapshotDate} />
        </div>

        <div className="relative grid border-t border-white/15 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCell
            inverse
            className="border-b border-white/15 sm:border-r xl:border-b-0"
            value={data.metrics.org_count.toLocaleString()}
            label="Organizations"
            note="Distinct records with this label"
          />
          <MetricCell
            inverse
            className="border-b border-white/15 xl:border-b-0 xl:border-r"
            value={data.metrics.project_count.toLocaleString()}
            label="Projects"
            note="Archived projects with this label"
          />
          <MetricCell
            inverse
            className="border-b border-white/15 sm:border-b-0 sm:border-r"
            value={data.metrics.avg_projects_per_org.toLocaleString()}
            label="Average projects"
            note="Per represented organization"
          />
          <MetricCell
            inverse
            value={yearRange}
            label="Recorded span"
            note="First to latest archived year"
          />
        </div>
      </section>

      <section
        aria-labelledby="technology-detail-evidence"
        className="deferred-section border-x border-border px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.58fr)] lg:items-end">
          <div>
            <p className="font-data text-[10px] uppercase tracking-[0.18em] text-accent-foreground">
              Yearly evidence
            </p>
            <h2
              id="technology-detail-evidence"
              className="mt-4 max-w-3xl text-balance text-[clamp(1.75rem,3vw,3rem)] font-medium leading-[1.02] tracking-[-0.035em]"
            >
              Two views of the same archive series.
            </h2>
          </div>
          <div>
            <Text className="text-muted-foreground">
              Counts describe records in the archive. They do not measure
              applicant demand, mentor availability, or selection odds.
            </Text>
            <SourceNote className="mt-5" date={snapshotDate} />
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid lg:grid-cols-2">
            <ChartPanel
              className="border-b border-border lg:border-b-0 lg:border-r"
              icon={TrendingUp}
              eyebrow="Organization coverage"
              title="Organizations by year"
              description={`Distinct organization records associated with ${data.name} in each archive year.`}
            >
              {hasYearlyData ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      accessibilityLayer
                      data={data.charts.popularity_by_year}
                      margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke={CHART_GRID_COLOR}
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        axisLine={false}
                        dataKey="year"
                        tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fill: CHART_AXIS_COLOR }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        formatter={(value: number) => [
                          value.toLocaleString(),
                          "Organizations",
                        ]}
                      />
                      <Line
                        dataKey="org_count"
                        dot={{
                          fill: "var(--chart-1)",
                          r: 3,
                          strokeWidth: 0,
                        }}
                        activeDot={{ r: 5 }}
                        name="Organizations"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        type="monotone"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmptyState />
              )}
            </ChartPanel>

            <ChartPanel
              icon={BarChart3}
              eyebrow="Project records"
              title="Projects by year"
              description={`Archived projects associated with ${data.name}, grouped by program year.`}
            >
              {hasYearlyData ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      accessibilityLayer
                      data={data.charts.popularity_by_year}
                      margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke={CHART_GRID_COLOR}
                        vertical={false}
                      />
                      <XAxis
                        axisLine={false}
                        dataKey="year"
                        tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fill: CHART_AXIS_COLOR }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        formatter={(value: number) => [
                          value.toLocaleString(),
                          "Projects",
                        ]}
                      />
                      <Bar
                        dataKey="project_count"
                        fill="var(--chart-2)"
                        maxBarSize={42}
                        name="Projects"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmptyState />
              )}
            </ChartPanel>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="technology-organizations-title"
        className="border border-border px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="font-data text-[10px] uppercase tracking-[0.18em] text-accent-foreground">
              Organization directory
            </p>
            <h2
              id="technology-organizations-title"
              className="mt-4 max-w-3xl text-balance text-[clamp(1.75rem,3vw,3rem)] font-medium leading-[1.02] tracking-[-0.035em]"
            >
              Records associated with {data.name}.
            </h2>
          </div>
          <Button variant="outline" asChild>
            <Link href="/tech-stack" prefetch>
              All technologies
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-3 rounded-xl border border-border bg-muted/35 p-3 sm:grid-cols-[minmax(0,1fr)_15rem]">
          <label className="relative">
            <span className="sr-only">Search organizations</span>
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="bg-card pl-9"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by organization or category"
              type="search"
              value={searchQuery}
            />
          </label>
          <label>
            <span className="sr-only">Sort organization records</span>
            <select
              className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              value={sortBy}
            >
              <option value="projects-desc">Most projects</option>
              <option value="projects-asc">Fewest projects</option>
              <option value="year-desc">Latest recorded year</option>
              <option value="name">Name A-Z</option>
            </select>
          </label>
        </div>

        <p
          aria-live="polite"
          className="mt-5 font-data text-[11px] text-muted-foreground"
          role="status"
        >
          Showing {filteredOrgs.length.toLocaleString()} of{" "}
          {data.organizations.length.toLocaleString()} organization records
        </p>

        {filteredOrgs.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrgs.map((organization) => (
              <OrganizationRecordCard
                key={organization.slug}
                organization={organization}
              />
            ))}
          </div>
        ) : (
          <div
            className="atlas-corner-marks mt-6 border border-dashed border-border bg-muted/25 px-6 py-14 text-center"
            role="status"
          >
            <h3 className="text-lg font-semibold">No organization records found.</h3>
            <Text variant="small" className="mt-2 text-muted-foreground">
              Try a different organization name or category.
            </Text>
          </div>
        )}
      </section>
    </PageRail>
  );
}

function ChartEmptyState() {
  return (
    <div className="flex h-[280px] items-center justify-center border border-dashed border-border text-sm text-muted-foreground">
      No yearly records are available.
    </div>
  );
}

function OrganizationRecordCard({
  organization,
}: {
  organization: TechOrgSnapshot;
}) {
  const years = [...organization.active_years].sort((a, b) => b - a);
  const latestYear = years[0];

  return (
    <Link
      href={`/organizations/${organization.slug}`}
      prefetch
      className="group atlas-corner-marks flex min-h-64 flex-col border border-border bg-card p-5 transition-[border-color,box-shadow,transform] duration-[180ms] hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[0_12px_30px_rgb(23_22_21/0.08)] motion-reduce:transform-none"
    >
      <div className="flex items-start gap-3">
        <OrganizationLogo
          name={organization.name}
          size={48}
          src={organization.logo_url}
        />
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold leading-5 tracking-[-0.02em]">
            {organization.name}
          </h3>
          <p className="mt-1 font-data text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Latest record {latestYear ?? "unknown"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col justify-between gap-5">
        <div className="flex flex-wrap gap-1.5">
          {organization.category ? (
            <Badge variant="category" size="xs">
              {organization.category}
            </Badge>
          ) : null}
          <Badge
            variant={organization.is_currently_active ? "year" : "neutral"}
            size="xs"
          >
            {organization.is_currently_active
              ? "Latest-year record"
              : "Historical record"}
          </Badge>
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-border pt-4">
          <div className="space-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Code2 aria-hidden="true" className="size-3.5" strokeWidth={1.6} />
              {organization.total_projects.toLocaleString()} projects
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarRange
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={1.6}
              />
              {years.length.toLocaleString()} recorded{" "}
              {years.length === 1 ? "year" : "years"}
            </span>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-[background-color,border-color,color] duration-[180ms] group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowRight aria-hidden="true" className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
