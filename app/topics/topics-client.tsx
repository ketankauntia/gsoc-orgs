"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Hash, Search } from "lucide-react";
import {
  Button,
  Input,
  MetricCell,
  PageRail,
  SourceNote,
} from "@/components/ui";
import type { TopicsIndexData } from "@/lib/topics-page-types";

interface TopicsClientProps {
  topics: TopicsIndexData["topics"];
  topTopics: TopicsIndexData["topics"];
  total: number;
  snapshotDate: string;
}

function formatTopicName(name: string) {
  if (!name) return name;
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

export function TopicsClient({
  topics,
  topTopics,
  total,
  snapshotDate,
}: TopicsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(60);

  const filteredTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return topics;

    return topics.filter(
      (topic) =>
        topic.name.toLowerCase().includes(query) ||
        topic.slug.toLowerCase().includes(query),
    );
  }, [topics, searchQuery]);

  const archiveMetrics = useMemo(() => {
    const years = new Set<number>();
    let topicsWithTenOrganizations = 0;

    for (const topic of topics) {
      for (const year of topic.years) years.add(year);
      if (topic.organizationCount >= 10) {
        topicsWithTenOrganizations += 1;
      }
    }

    return {
      recordedYears: years.size,
      topicsWithTenOrganizations,
    };
  }, [topics]);

  const visibleTopics = filteredTopics.slice(0, visibleCount);
  const hasSearch = searchQuery.trim().length > 0;

  return (
    <PageRail className="px-0" innerClassName="max-w-none px-0">
      <section
        aria-labelledby="topics-page-title"
        className="relative overflow-hidden rounded-[1.5rem] bg-ink text-[#f5eee9]"
      >
        <div aria-hidden="true" className="atlas-grid absolute inset-0 opacity-20" />
        <div className="relative px-6 py-12 sm:px-9 sm:py-16 lg:px-12 lg:py-20">
          <p className="font-data text-[10px] uppercase tracking-[0.18em] text-primary">
            Topic atlas · generated archive index
          </p>
          <h1
            id="topics-page-title"
            className="mt-5 max-w-4xl text-[clamp(2.25rem,5vw,4.75rem)] font-medium leading-[0.98] tracking-[-0.045em] text-balance"
          >
            Follow the subjects that connect GSoC communities.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 tracking-[-0.012em] text-[#aaa29d]">
            Search topic labels recorded on organization profiles, then open a
            topic to review associated organizations, projects, and active
            years.
          </p>
          <SourceNote inverse className="mt-8" date={snapshotDate} />
        </div>

        <div className="relative grid border-t border-white/15 sm:grid-cols-3">
          <MetricCell
            inverse
            className="border-b border-white/15 sm:border-b-0 sm:border-r"
            value={total.toLocaleString()}
            label="Topic labels"
            note="Distinct labels in this index"
          />
          <MetricCell
            inverse
            className="border-b border-white/15 sm:border-b-0 sm:border-r"
            value={archiveMetrics.recordedYears.toLocaleString()}
            label="Recorded years"
            note="Unique program years represented"
          />
          <MetricCell
            inverse
            value={archiveMetrics.topicsWithTenOrganizations.toLocaleString()}
            label="Broad-coverage topics"
            note="Linked to at least 10 organizations"
          />
        </div>
      </section>

      <section
        aria-labelledby="topic-directory-title"
        className="border-x border-border px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(20rem,1fr)] lg:items-end">
          <div>
            <p className="font-data text-[10px] uppercase tracking-[0.18em] text-accent-foreground">
              Topic directory
            </p>
            <h2
              id="topic-directory-title"
              className="mt-4 text-[clamp(2.25rem,5vw,4.75rem)] font-medium leading-[0.98] tracking-[-0.045em] text-balance"
            >
              Start with a subject, then inspect the evidence.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Counts describe this archive snapshot. They do not measure
              applicant demand, mentoring capacity, or acceptance likelihood.
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
              placeholder="Search topic labels"
              className="h-14 rounded-xl bg-card pl-12 pr-4 text-base shadow-[0_12px_35px_rgb(23_22_21/0.08)]"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setVisibleCount(60);
              }}
              aria-label="Search topic labels"
            />
          </div>
        </div>

        {!hasSearch && topTopics.length > 0 ? (
          <section
            aria-labelledby="topic-leaders-title"
            className="mt-16"
          >
            <div className="mb-6 flex flex-col gap-3 border-y border-border py-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-data text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Snapshot ranking
                </p>
                <h3
                  id="topic-leaders-title"
                  className="mt-2 text-2xl font-semibold tracking-[-0.035em]"
                >
                  Highest organization coverage
                </h3>
              </div>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Six topic labels linked to the most distinct organizations in
                this generated index.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,270px),1fr))] gap-4">
              {topTopics.map((topic, index) => (
                <TopicCard
                  key={topic.slug}
                  rank={index + 1}
                  topic={topic}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="all-topics-title" className="mt-16">
          <div className="mb-6 border-y border-border py-4">
            <p
              className="font-data text-xs text-muted-foreground"
              aria-live="polite"
            >
              Showing {visibleTopics.length.toLocaleString()} of{" "}
              {filteredTopics.length.toLocaleString()} topic
              {filteredTopics.length === 1 ? "" : "s"}
            </p>
            <h3
              id="all-topics-title"
              className="mt-1 text-2xl font-semibold tracking-[-0.035em]"
            >
              {hasSearch ? "Search results" : "All topics"}
            </h3>
          </div>

          {filteredTopics.length === 0 ? (
            <div className="atlas-corner-marks flex min-h-72 flex-col items-center justify-center border border-border bg-card p-8 text-center">
              <Search
                aria-hidden="true"
                className="size-7 text-accent-foreground"
                strokeWidth={1.5}
              />
              <h4 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">
                No topic labels match that search.
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
                {visibleTopics.map((topic) => (
                  <TopicCard key={topic.slug} topic={topic} />
                ))}
              </div>

              {visibleCount < filteredTopics.length ? (
                <div className="mt-10 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() =>
                      setVisibleCount((current) => current + 60)
                    }
                  >
                    Show 60 more
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </section>

        <SourceNote className="mt-12" date={snapshotDate} />
      </section>
    </PageRail>
  );
}

function TopicCard({
  topic,
  rank,
}: {
  topic: TopicsIndexData["topics"][number];
  rank?: number;
}) {
  const years = [...topic.years].sort((a, b) => a - b);
  const firstYear = years[0];
  const latestYear = years[years.length - 1];
  const activityRange =
    firstYear === undefined
      ? "No years recorded"
      : firstYear === latestYear
        ? String(firstYear)
        : `${firstYear}–${latestYear}`;

  return (
    <Link
      href={`/topics/${topic.slug}`}
      prefetch
      className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <article className="atlas-corner-marks flex h-full min-h-56 flex-col border border-border bg-card p-5 shadow-[0_1px_1px_rgb(23_22_21/0.04)] transition-[background-color,border-color,box-shadow,transform] duration-180 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[0_10px_30px_rgb(23_22_21/0.08)] motion-reduce:transform-none">
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Hash aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </div>
          {rank ? (
            <span className="font-data text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Rank {String(rank).padStart(2, "0")}
            </span>
          ) : null}
        </div>

        <h4 className="mt-6 text-xl font-semibold tracking-[-0.03em] transition-colors duration-150 group-hover:text-accent-foreground">
          {formatTopicName(topic.name)}
        </h4>
        <p className="mt-2 font-data text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Active years · {activityRange}
        </p>

        <dl className="mt-5 grid grid-cols-2 border-y border-border py-3">
          <div>
            <dt className="font-data text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              Organizations
            </dt>
            <dd className="mt-1 font-data text-lg font-medium tabular-nums">
              {topic.organizationCount.toLocaleString()}
            </dd>
          </div>
          <div className="border-l border-border pl-4">
            <dt className="font-data text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              Projects
            </dt>
            <dd className="mt-1 font-data text-lg font-medium tabular-nums">
              {topic.projectCount.toLocaleString()}
            </dd>
          </div>
        </dl>

        <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold">
          Open topic
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
