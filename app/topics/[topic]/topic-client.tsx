"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  FolderGit2,
  Hash,
  Search,
} from "lucide-react";
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
import type { TopicPageData } from "@/lib/topics-page-types";

interface TopicPageClientProps {
  topic: TopicPageData;
}

type TopicOrganization = TopicPageData["organizations"][number];

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

function formatYearRange(years: number[]) {
  if (years.length === 0) return "No years";
  const sortedYears = [...years].sort((a, b) => a - b);
  if (sortedYears.length === 1) return String(sortedYears[0]);
  return `${sortedYears[0]}-${sortedYears[sortedYears.length - 1]}`;
}

export function TopicPageClient({ topic }: TopicPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");

  const availableYears = useMemo(
    () => [...topic.years].sort((a, b) => b - a),
    [topic.years],
  );

  const filteredOrgs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return topic.organizations.filter(
      (organization) =>
        (!query ||
          organization.name.toLowerCase().includes(query) ||
          organization.slug.toLowerCase().includes(query)) &&
        (selectedYear === "all" ||
          organization.active_years.includes(selectedYear)),
    );
  }, [topic.organizations, searchQuery, selectedYear]);

  const yearlyEntries = Object.entries(topic.yearlyStats).sort(
    ([yearA], [yearB]) => Number(yearB) - Number(yearA),
  );
  const snapshotDate = formatSnapshotDate(topic.published_at);

  return (
    <PageRail className="px-0" innerClassName="max-w-none px-0">
      <section
        aria-labelledby="topic-detail-title"
        className="relative overflow-hidden rounded-[1.5rem] bg-ink text-[#f5eee9]"
      >
        <div aria-hidden="true" className="atlas-dot-field absolute inset-0 opacity-30" />
        <div className="relative px-6 py-12 sm:px-9 sm:py-16 lg:px-12 lg:py-20">
          <div className="flex items-center gap-2 font-data text-[10px] uppercase tracking-[0.18em] text-primary">
            <Hash aria-hidden="true" className="size-3.5" />
            Topic record
          </div>
          <h1
            id="topic-detail-title"
            className="mt-5 max-w-4xl text-balance text-[clamp(2.75rem,7vw,6.5rem)] font-medium leading-[0.92] tracking-[-0.055em]"
          >
            {topic.name}
          </h1>
          <Text variant="lead" className="mt-6 max-w-2xl text-[#aaa29d]">
            Review organization and project records carrying this topic label,
            with filters for each archived program year.
          </Text>
          <SourceNote inverse className="mt-8" date={snapshotDate} />
        </div>

        <div className="relative grid border-t border-white/15 sm:grid-cols-3">
          <MetricCell
            inverse
            className="border-b border-white/15 sm:border-b-0 sm:border-r"
            value={topic.organizationCount.toLocaleString()}
            label="Organizations"
            note="Distinct records with this topic"
          />
          <MetricCell
            inverse
            className="border-b border-white/15 sm:border-b-0 sm:border-r"
            value={topic.projectCount.toLocaleString()}
            label="Projects"
            note="Archived projects with this topic"
          />
          <MetricCell
            inverse
            value={formatYearRange(topic.years)}
            label="Recorded span"
            note={`${topic.years.length.toLocaleString()} archive years`}
          />
        </div>
      </section>

      {yearlyEntries.length > 0 ? (
        <section
          aria-labelledby="topic-yearly-title"
          className="deferred-section border-x border-border px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
        >
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.58fr)] lg:items-end">
            <div>
              <p className="font-data text-[10px] uppercase tracking-[0.18em] text-accent-foreground">
                Archive timeline
              </p>
              <h2
                id="topic-yearly-title"
                className="mt-4 max-w-3xl text-balance text-[clamp(1.75rem,3vw,3rem)] font-medium leading-[1.02] tracking-[-0.035em]"
              >
                Year-by-year topic coverage.
              </h2>
            </div>
            <div>
              <Text className="text-muted-foreground">
                Organization and project totals are grouped by archive year.
                They are descriptive counts, not a forecast of future demand.
              </Text>
              <SourceNote className="mt-5" date={snapshotDate} />
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <caption className="sr-only">
                  Organization and project counts for {topic.name} by year
                </caption>
                <thead>
                  <tr className="border-b border-border bg-muted/45">
                    <th
                      className="px-5 py-3 font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
                      scope="col"
                    >
                      Program year
                    </th>
                    <th
                      className="px-5 py-3 text-right font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
                      scope="col"
                    >
                      Organizations
                    </th>
                    <th
                      className="px-5 py-3 text-right font-data text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
                      scope="col"
                    >
                      Projects
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyEntries.map(([year, stats]) => (
                    <tr
                      key={year}
                      className="border-b border-border last:border-b-0"
                    >
                      <th
                        className="px-5 py-4 font-data text-sm font-semibold"
                        scope="row"
                      >
                        {year}
                      </th>
                      <td className="px-5 py-4 text-right font-data text-sm tabular-nums">
                        {stats.organizationCount.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right font-data text-sm tabular-nums">
                        {stats.projectCount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      <section
        aria-labelledby="topic-organizations-title"
        className="border border-border px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="font-data text-[10px] uppercase tracking-[0.18em] text-accent-foreground">
              Organization directory
            </p>
            <h2
              id="topic-organizations-title"
              className="mt-4 max-w-3xl text-balance text-[clamp(1.75rem,3vw,3rem)] font-medium leading-[1.02] tracking-[-0.035em]"
            >
              Records tagged {topic.name}.
            </h2>
          </div>
          <Button variant="outline" asChild>
            <Link href="/topics" prefetch>
              All topics
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
              placeholder="Search organization records"
              type="search"
              value={searchQuery}
            />
          </label>

          <label>
            <span className="sr-only">Filter by program year</span>
            <select
              className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onChange={(event) =>
                setSelectedYear(
                  event.target.value === "all"
                    ? "all"
                    : Number(event.target.value),
                )
              }
              value={selectedYear}
            >
              <option value="all">All program years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p
          aria-live="polite"
          className="mt-5 font-data text-[11px] text-muted-foreground"
          role="status"
        >
          Showing {filteredOrgs.length.toLocaleString()} of{" "}
          {topic.organizations.length.toLocaleString()} organization records
        </p>

        {filteredOrgs.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrgs.map((organization) => (
              <TopicOrganizationCard
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
              Try another name or select a different program year.
            </Text>
          </div>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <Text variant="small" className="max-w-xl text-muted-foreground">
            Continue with the full organization directory to combine topics,
            technologies, years, and status filters.
          </Text>
          <Button asChild>
            <Link href="/organizations" prefetch>
              Browse organizations
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </PageRail>
  );
}

function TopicOrganizationCard({
  organization,
}: {
  organization: TopicOrganization;
}) {
  const years = [...organization.active_years].sort((a, b) => b - a);
  const recordedSpan =
    organization.first_year === organization.last_year
      ? String(organization.first_year)
      : `${organization.first_year}-${organization.last_year}`;

  return (
    <Link
      href={`/organizations/${organization.slug}`}
      prefetch
      className="group atlas-corner-marks flex min-h-60 flex-col border border-border bg-card p-5 transition-[border-color,box-shadow,transform] duration-[180ms] hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[0_12px_30px_rgb(23_22_21/0.08)] motion-reduce:transform-none"
    >
      <div className="flex items-start gap-3">
        <OrganizationLogo name={organization.name} size={48} />
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold leading-5 tracking-[-0.02em]">
            {organization.name}
          </h3>
          <p className="mt-1 font-data text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Recorded {recordedSpan}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col justify-between gap-5">
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={organization.is_currently_active ? "year" : "neutral"}
            size="xs"
          >
            {organization.is_currently_active
              ? "Latest-year record"
              : "Historical record"}
          </Badge>
          {years.slice(0, 3).map((year) => (
            <Badge key={year} variant="outline" size="xs">
              {year}
            </Badge>
          ))}
          {years.length > 3 ? (
            <Badge variant="neutral" size="xs">
              +{years.length - 3}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-border pt-4">
          <div className="space-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FolderGit2
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={1.6}
              />
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
