"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpDown,
  Braces,
  Search,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import type { TechSummary } from "@/lib/tech-stack-page-types";

interface TechStackClientWrapperProps {
  techs: TechSummary[];
}

type SortOption =
  | "name"
  | "org-count-desc"
  | "org-count-asc"
  | "project-count-desc";

function formatTechnologyName(name: string) {
  if (!name) return name;
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

export function TechStackClientWrapper({
  techs,
}: TechStackClientWrapperProps) {
  const [searchQuery, setSearchQueryState] = useState("");
  const [sortBy, setSortByState] =
    useState<SortOption>("org-count-desc");
  const [visibleCount, setVisibleCount] = useState(24);

  const setSearchQuery = (value: string) => {
    setSearchQueryState(value);
    setVisibleCount(24);
  };

  const setSortBy = (value: SortOption) => {
    setSortByState(value);
    setVisibleCount(24);
  };

  const filteredTechs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = query
      ? techs.filter((technology) =>
          technology.name.toLowerCase().includes(query),
        )
      : [...techs];

    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "org-count-desc":
        result.sort((a, b) => b.org_count - a.org_count);
        break;
      case "org-count-asc":
        result.sort((a, b) => a.org_count - b.org_count);
        break;
      case "project-count-desc":
        result.sort((a, b) => b.project_count - a.project_count);
        break;
    }

    return result;
  }, [techs, searchQuery, sortBy]);

  const topTechnologies = useMemo(
    () =>
      [...techs]
        .sort((a, b) => b.org_count - a.org_count)
        .slice(0, 6),
    [techs],
  );
  const visibleTechs = filteredTechs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTechs.length;
  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="space-y-16">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(20rem,1fr)] lg:items-end">
        <div>
          <p className="font-data text-[10px] uppercase tracking-[0.18em] text-accent-foreground">
            Technology directory
          </p>
          <h2 className="mt-4 text-[clamp(2.25rem,5vw,4.75rem)] font-medium leading-[0.98] tracking-[-0.045em] text-balance">
            Move from a stack to the organizations using it.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Search the generated index, compare recorded counts, and open a
            technology page for its organization history.
          </p>
        </div>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            type="search"
            placeholder="Search technology labels"
            aria-label="Search technology labels"
            className="h-14 rounded-xl bg-card pl-12 pr-4 text-base shadow-[0_12px_35px_rgb(23_22_21/0.08)]"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      {!hasSearch && topTechnologies.length > 0 ? (
        <section aria-labelledby="technology-leaders-title">
          <div className="mb-6 flex flex-col gap-3 border-y border-border py-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-data text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Snapshot ranking
              </p>
              <h3
                id="technology-leaders-title"
                className="mt-2 text-2xl font-semibold tracking-[-0.035em]"
              >
                Highest organization coverage
              </h3>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Six technology labels linked to the most distinct
              organizations in this index.
            </p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,270px),1fr))] gap-4">
            {topTechnologies.map((technology, index) => (
              <TechStackCard
                key={technology.slug}
                rank={index + 1}
                stack={technology}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="all-technologies-title">
        <div className="mb-6 flex flex-col gap-4 border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className="font-data text-xs text-muted-foreground"
              aria-live="polite"
            >
              Showing {visibleTechs.length.toLocaleString()} of{" "}
              {filteredTechs.length.toLocaleString()} technolog
              {filteredTechs.length === 1 ? "y" : "ies"}
            </p>
            <h3
              id="all-technologies-title"
              className="mt-1 text-2xl font-semibold tracking-[-0.035em]"
            >
              {hasSearch ? "Search results" : "All technologies"}
            </h3>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <ArrowUpDown
              aria-hidden="true"
              className="size-4 text-muted-foreground"
              strokeWidth={1.5}
            />
            <span className="sr-only sm:not-sr-only">Sort by</span>
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as SortOption)
              }
              className="h-10 rounded-lg border border-input bg-card px-3 text-sm shadow-[0_1px_0_rgb(23_22_21/0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              aria-label="Sort technologies"
            >
              <option value="org-count-desc">Most organizations</option>
              <option value="project-count-desc">Most projects</option>
              <option value="name">Name, A to Z</option>
              <option value="org-count-asc">Fewest organizations</option>
            </select>
          </label>
        </div>

        {filteredTechs.length === 0 ? (
          <div className="atlas-corner-marks flex min-h-72 flex-col items-center justify-center border border-border bg-card p-8 text-center">
            <Search
              aria-hidden="true"
              className="size-7 text-accent-foreground"
              strokeWidth={1.5}
            />
            <h4 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">
              No technology labels match that search.
            </h4>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Try a shorter term or clear the search to return to the full
              archive index.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-6"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,270px),1fr))] gap-4">
              {visibleTechs.map((technology) => (
                <TechStackCard
                  key={technology.slug}
                  stack={technology}
                />
              ))}
            </div>

            {hasMore ? (
              <div className="mt-10 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() =>
                    setVisibleCount((current) => current + 24)
                  }
                >
                  Show 24 more
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function TechStackCard({
  stack,
  rank,
}: {
  stack: TechSummary;
  rank?: number;
}) {
  const displayName = formatTechnologyName(stack.name);

  return (
    <Link
      href={`/tech-stack/${stack.slug}`}
      prefetch
      className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <article className="atlas-corner-marks flex h-full min-h-52 flex-col border border-border bg-card p-5 shadow-[0_1px_1px_rgb(23_22_21/0.04)] transition-[background-color,border-color,box-shadow,transform] duration-180 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[0_10px_30px_rgb(23_22_21/0.08)] motion-reduce:transform-none">
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Braces aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </div>
          {rank ? (
            <span className="font-data text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Rank {String(rank).padStart(2, "0")}
            </span>
          ) : null}
        </div>

        <h4 className="mt-6 text-xl font-semibold tracking-[-0.03em] transition-colors duration-150 group-hover:text-accent-foreground">
          {displayName}
        </h4>

        <dl className="mt-5 grid grid-cols-2 border-y border-border py-3">
          <div>
            <dt className="font-data text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              Organizations
            </dt>
            <dd className="mt-1 font-data text-lg font-medium tabular-nums">
              {stack.org_count.toLocaleString()}
            </dd>
          </div>
          <div className="border-l border-border pl-4">
            <dt className="font-data text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              Projects
            </dt>
            <dd className="mt-1 font-data text-lg font-medium tabular-nums">
              {stack.project_count.toLocaleString()}
            </dd>
          </div>
        </dl>

        <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold">
          Open technology
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
            strokeWidth={1.5}
          />
        </span>
      </article>
    </Link>
  );
}
