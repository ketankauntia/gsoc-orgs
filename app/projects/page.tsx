import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarRange,
} from "lucide-react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/header";
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCell } from "@/components/ui/metric-cell";
import { PageRail } from "@/components/ui/page-rail";
import { SourceNote } from "@/components/ui/source-note";
import {
  getAvailableProjectYears,
  loadProjectsYearData,
  type ProjectYearPageData,
} from "@/lib/projects-page-types";

// Static Generation - cache forever
export const revalidate = false;

export const metadata = {
  title: "GSoC Projects by Year",
  description:
    "Explore Google Summer of Code projects by year. Browse historical project data from 2016 to 2025.",
};

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatSnapshotDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : dateFormatter.format(date);
}

export default async function ProjectsIndexPage() {
  const projectDocuments = await Promise.all(
    getAvailableProjectYears().map(loadProjectsYearData),
  );
  const yearData = projectDocuments
    .filter(
      (document): document is ProjectYearPageData => document !== null,
    )
    .sort((a, b) => b.year - a.year);

  const totalProjects = yearData.reduce(
    (sum, document) => sum + document.metrics.total_projects,
    0,
  );
  const totalOrganizationAppearances = yearData.reduce(
    (sum, document) => sum + document.metrics.total_organizations,
    0,
  );
  const latestSnapshot = yearData[0];
  const oldestSnapshot = yearData[yearData.length - 1];
  const archiveRange =
    latestSnapshot && oldestSnapshot
      ? `${oldestSnapshot.year}\u2013${latestSnapshot.year}`
      : "No snapshots";
  const latestSnapshotDate = latestSnapshot
    ? formatSnapshotDate(latestSnapshot.published_at)
    : "Date unavailable";

  return (
    <>
      <Header />
      <main className="pt-16">
        <PageRail
          className="bg-ink text-[#f5eee9]"
          innerClassName="border-white/10 pb-14 pt-5 sm:pb-20"
        >
          <SiteBreadcrumbs
            className="py-4 [&_a]:text-[#aaa29d] [&_a:hover]:text-[#f5eee9] [&_span]:text-[#f5eee9] [&_svg]:text-white/30"
            items={[{ label: "Projects", href: "/projects" }]}
          />

          <header className="atlas-grid mt-5 border-t border-white/10 py-10 sm:py-14 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_22rem] lg:items-end">
              <div className="min-w-0">
                <p className="font-data text-[10px] uppercase tracking-[0.18em] text-primary">
                  Project archive / {archiveRange}
                </p>
                <h1 className="mt-6 max-w-5xl text-balance text-[clamp(3rem,7vw,6.6rem)] font-medium leading-[0.9] tracking-[-0.065em]">
                  Projects, year by year.
                </h1>
                <p className="mt-7 max-w-2xl text-pretty text-base leading-7 text-[#c8c0ba] sm:text-lg">
                  Move through a decade of accepted project records, then follow
                  the organizations and technologies that shaped each program
                  year.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  {latestSnapshot ? (
                    <Button asChild size="lg">
                      <Link href={`/projects/${latestSnapshot.year}`}>
                        Explore {latestSnapshot.year}
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : null}
                  <Button
                    asChild
                    className="border-white/20 bg-transparent text-[#f5eee9] hover:border-white/35 hover:bg-white/10"
                    size="lg"
                    variant="outline"
                  >
                    <Link href="/organizations">
                      Browse organizations
                      <Building2 aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>

              <aside className="border-t border-white/15 pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                <p className="font-data text-[10px] uppercase tracking-[0.18em] text-primary">
                  How to read the totals
                </p>
                <p className="mt-4 text-sm leading-6 text-[#c8c0ba]">
                  Project records are summed across yearly snapshots.
                  Organization totals count appearances in each year, not
                  distinct organizations across the full archive.
                </p>
                <SourceNote
                  className="mt-6"
                  date={latestSnapshotDate}
                  inverse
                  source="Latest loaded project snapshot"
                />
              </aside>
            </div>
          </header>

          <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-ink-soft sm:grid-cols-2 lg:grid-cols-4">
            <MetricCell
              className="border-b border-white/10 sm:border-r lg:border-b-0"
              inverse
              label="Project records"
              note="Summed across loaded yearly snapshots"
              value={numberFormatter.format(totalProjects)}
            />
            <MetricCell
              className="border-b border-white/10 lg:border-b-0 lg:border-r"
              inverse
              label="Organization appearances"
              note="A participating organization can repeat by year"
              value={numberFormatter.format(totalOrganizationAppearances)}
            />
            <MetricCell
              className="border-b border-white/10 sm:border-b-0 sm:border-r"
              inverse
              label="Years with project data"
              note={archiveRange}
              value={numberFormatter.format(yearData.length)}
            />
            <MetricCell
              inverse
              label="Latest project archive"
              note="Only years with a loaded project document are linked"
              value={latestSnapshot?.year ?? "\u2014"}
            />
          </div>
        </PageRail>

        <PageRail as="div" innerClassName="py-16 sm:py-20 lg:py-24">
          <section aria-labelledby="project-years-heading">
            <div className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <div>
                <p className="font-data text-[10px] uppercase tracking-[0.18em] text-accent-foreground">
                  Browse the archive
                </p>
                <h2
                  className="mt-5 max-w-2xl text-balance text-[clamp(2.5rem,5vw,4.75rem)] font-medium leading-[0.94] tracking-[-0.055em]"
                  id="project-years-heading"
                >
                  Pick a year. Follow the evidence.
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground lg:justify-self-end lg:text-lg">
                Each snapshot pairs the accepted projects with its participating
                organizations and recorded technology signals. Counts below come
                directly from the loaded archive documents.
              </p>
            </div>

            {yearData.length > 0 ? (
              <div className="grid border-l border-t border-border md:grid-cols-2 lg:grid-cols-3">
                {yearData.map((document) => {
                  const topOrganization = document.insights.top_org;
                  const topTechnology = document.insights.top_tech;

                  return (
                    <Link
                      aria-label={`Explore GSoC ${document.year} project records`}
                      className="group flex min-h-[21rem] flex-col justify-between border-b border-r border-border bg-card p-6 outline-none transition-[background-color,border-color,box-shadow] duration-[180ms] hover:bg-muted/70 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset sm:p-7"
                      href={`/projects/${document.year}`}
                      key={document.year}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-data text-[10px] uppercase tracking-[0.18em] text-accent-foreground">
                              Program year
                            </p>
                            <h3 className="mt-3 text-4xl font-medium tracking-[-0.045em]">
                              {document.year}
                            </h3>
                          </div>
                          <Badge
                            className="group-hover:border-foreground/15"
                            variant={document.finalized ? "neutral" : "category"}
                          >
                            {document.finalized ? "Finalized" : "Partial"}
                          </Badge>
                        </div>

                        <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-border py-5">
                          <div>
                            <dt className="font-data text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                              Projects
                            </dt>
                            <dd className="mt-2 text-2xl font-semibold tabular-nums">
                              {numberFormatter.format(
                                document.metrics.total_projects,
                              )}
                            </dd>
                          </div>
                          <div className="border-l border-border pl-4">
                            <dt className="font-data text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                              Organizations
                            </dt>
                            <dd className="mt-2 text-2xl font-semibold tabular-nums">
                              {numberFormatter.format(
                                document.metrics.total_organizations,
                              )}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="mt-7">
                        <dl className="space-y-3 text-sm">
                          <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] gap-3">
                            <dt className="text-muted-foreground">
                              Top organization
                            </dt>
                            <dd className="truncate font-medium text-right">
                              {topOrganization?.name ?? "Not recorded"}
                            </dd>
                          </div>
                          <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] gap-3">
                            <dt className="text-muted-foreground">
                              Top technology
                            </dt>
                            <dd className="truncate font-medium text-right">
                              {topTechnology?.name ?? "Not recorded"}
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-6 flex items-end justify-between gap-4 border-t border-border pt-5">
                          <p className="font-data text-[10px] leading-5 text-muted-foreground">
                            Snapshot{" "}
                            <time dateTime={document.published_at}>
                              {formatSnapshotDate(document.published_at)}
                            </time>
                          </p>
                          <ArrowUpRight
                            aria-hidden="true"
                            className="size-5 shrink-0 text-muted-foreground transition-[color,transform] duration-[180ms] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="border-x border-b border-border bg-card px-6 py-16 text-center">
                <CalendarRange
                  aria-hidden="true"
                  className="mx-auto size-7 text-muted-foreground"
                />
                <h3 className="mt-5 text-xl font-semibold">
                  No project snapshots are available
                </h3>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                  The archive index could not load a yearly project document.
                  Organization research is still available.
                </p>
                <Button asChild className="mt-6" variant="outline">
                  <Link href="/organizations">Browse organizations</Link>
                </Button>
              </div>
            )}
          </section>

          <section
            aria-labelledby="project-next-step-heading"
            className="mt-12 grid gap-8 rounded-2xl border border-border bg-muted px-6 py-8 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center"
          >
            <div>
              <p className="font-data text-[10px] uppercase tracking-[0.18em] text-accent-foreground">
                Change the lens
              </p>
              <h2
                className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl"
                id="project-next-step-heading"
              >
                Research the communities behind the work.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Move from annual project records into organization profiles,
                participation history, and recorded technology stacks.
              </p>
            </div>
            <Button asChild size="lg" variant="outline">
              <Link href="/organizations">
                Open organization explorer
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </section>
        </PageRail>
      </main>
      <Footer />
    </>
  );
}
