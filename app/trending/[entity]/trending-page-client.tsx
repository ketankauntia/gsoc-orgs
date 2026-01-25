"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Text,
  Button,
  SectionHeader,
} from "@/components/ui";
import {
  type TrendingSnapshot,
  type TrendingEntity,
  type TrendingRange,
  type TrendingOrganizationItem,
} from "@/lib/trending-types";
import { cn } from "@/lib/utils";

interface TrendingPageClientProps {
  entity: TrendingEntity;
  snapshot: TrendingSnapshot;
  currentRange: TrendingRange;
  archiveYear?: number;
  archiveMonth?: number;
}

const RANGE_OPTIONS: { value: TrendingRange; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const ENTITY_OPTIONS: { value: TrendingEntity; label: string; href: string }[] = [
  { value: "organizations", label: "Organizations", href: "/trending/organizations" },
  { value: "projects", label: "Projects", href: "/trending/projects" },
  { value: "tech-stack", label: "Tech Stack", href: "/trending/tech-stack" },
  { value: "topics", label: "Topics", href: "/trending/topics" },
];

function getEntityDisplayName(entity: TrendingEntity): string {
  switch (entity) {
    case "organizations":
      return "Organizations";
    case "projects":
      return "Projects";
    case "tech-stack":
      return "Tech Stack";
    case "topics":
      return "Topics";
    default:
      return entity;
  }
}

function formatChange(change: number, changePercent: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change} (${sign}${changePercent.toFixed(1)}%)`;
}

export function TrendingPageClient({
  entity,
  snapshot,
  currentRange,
  archiveYear,
  archiveMonth,
}: TrendingPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showArchive, setShowArchive] = useState(!!archiveYear);

  const isArchiveView = archiveYear !== undefined;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleRangeChange = (newRange: TrendingRange) => {
    if (newRange === currentRange) return;

    startTransition(() => {
      const params = new URLSearchParams();
      if (newRange !== "monthly") {
        params.set("range", newRange);
      }
      if (archiveYear) params.set("year", archiveYear.toString());
      if (archiveMonth) params.set("month", archiveMonth.toString());
      router.push(`/trending/${entity}?${params.toString()}`);
    });
  };

  const handleArchiveToggle = () => {
    setShowArchive(!showArchive);
    if (showArchive) {
      // Clear archive params
      startTransition(() => {
        const params = new URLSearchParams();
        if (currentRange !== "monthly") {
          params.set("range", currentRange);
        }
        router.push(`/trending/${entity}?${params.toString()}`);
      });
    }
  };

  const handleYearChange = (year: number) => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (currentRange !== "monthly") {
        params.set("range", currentRange);
      }
      params.set("year", year.toString());
      if (archiveMonth) params.set("month", archiveMonth.toString());
      router.push(`/trending/${entity}?${params.toString()}`);
    });
  };

  const handleMonthChange = (month: number) => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (currentRange !== "monthly") {
        params.set("range", currentRange);
      }
      if (archiveYear) params.set("year", archiveYear.toString());
      params.set("month", month.toString());
      router.push(`/trending/${entity}?${params.toString()}`);
    });
  };

  const entityName = getEntityDisplayName(entity);

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
      {/* Entity Navigation - Primary Category Selector - Above Heading */}
      <div className="mb-10 flex flex-wrap justify-center gap-3">
        {ENTITY_OPTIONS.map((option) => {
          const isActive = entity === option.value;
          const params = new URLSearchParams();
          if (currentRange !== "monthly") params.set("range", currentRange);
          if (archiveYear) params.set("year", archiveYear.toString());
          if (archiveMonth) params.set("month", archiveMonth.toString());
          const queryString = params.toString();
          
          return (
            <Link
              key={option.value}
              href={`${option.href}${queryString ? `?${queryString}` : ""}`}
              className={cn(
                "px-5 py-2.5 rounded-lg text-sm font-semibold transition-all",
                isActive
                  ? "bg-teal-600 text-white shadow-md hover:bg-teal-700"
                  : "bg-background text-foreground border border-border hover:bg-teal-50 hover:border-teal-200 dark:hover:bg-teal-950/20 dark:hover:border-teal-800"
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {/* Header Section - Centered */}
      <div className="mb-10 max-w-3xl mx-auto">
        <SectionHeader
          badge="Trending"
          title={`Trending ${entityName}`}
          description={`Discover what's gaining momentum in Google Summer of Code. Track the latest trends and see which ${entityName.toLowerCase()} are rising in popularity.`}
          align="center"
          className="mb-8"
        />
      </div>

      {/* Time Range Selector - Centered */}
      <div className="mb-6 flex flex-wrap justify-center gap-3">
        {RANGE_OPTIONS.map((option) => {
          const isActive = currentRange === option.value;
          return (
            <Button
              key={option.value}
              variant={isActive ? "default" : "outline"}
              size="default"
              onClick={() => handleRangeChange(option.value)}
              disabled={isPending}
              className={cn(
                "transition-all font-medium",
                isActive
                  ? "bg-teal-600 text-white hover:bg-teal-700 font-semibold shadow-md border-teal-600"
                  : "hover:bg-teal-50 hover:border-teal-200 dark:hover:bg-teal-950/20 dark:hover:border-teal-800"
              )}
            >
              {option.label}
            </Button>
          );
        })}
      </div>

      {/* Archive Toggle and Selectors - Deactivated for now */}
      {/* <div className="mb-8 flex flex-col items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleArchiveToggle}
          className="text-sm"
        >
          {isArchiveView ? "← View Current" : "View Archive"}
        </Button>

        {showArchive && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Year:</label>
              <select
                value={archiveYear || currentYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {currentRange !== "yearly" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">Month:</label>
                <select
                  value={archiveMonth || new Date().getMonth() + 1}
                  onChange={(e) => handleMonthChange(parseInt(e.target.value, 10))}
                  className="px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {new Date(2000, month - 1).toLocaleString("default", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div> */}

      {/* Snapshot Info - Centered */}
      <div className="mb-8 text-sm text-muted-foreground border-b border-border pb-4 text-center">
        <span className="font-medium">
          {isArchiveView
            ? `Archive snapshot from ${archiveYear}${archiveMonth ? ` ${new Date(2000, (archiveMonth || 1) - 1).toLocaleString("default", { month: "long" })}` : ""}`
            : "Last updated: "}
          {new Date(snapshot.snapshot_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Trending Items */}
      {snapshot.items.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <Text className="text-muted-foreground text-base mb-2">
              No trending data available for this time range.
            </Text>
            <Text className="text-muted-foreground text-sm">
              Check back later or try a different time range.
            </Text>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {entity === "organizations" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {(snapshot.items as TrendingOrganizationItem[]).map((item) => {
                const logoUrl = item.metadata?.img_r2_url || item.metadata?.logo_r2_url || item.metadata?.image_url;

                return (
                  <Link
                    key={item.id}
                    href={`/organizations/${item.slug}`}
                    prefetch={true}
                    className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all w-full dark:bg-card dark:border-border dark:hover:border-gray-600"
                  >
                    {/* Header with Logo and Rank */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {logoUrl && typeof logoUrl === 'string' ? (
                          <Image
                            src={logoUrl}
                            alt={`${item.name} logo`}
                            width={48}
                            height={48}
                            className="w-full h-full object-contain"
                            unoptimized={true}
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-lg font-semibold text-gray-400 dark:text-muted-foreground">
                            {item.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-foreground text-base line-clamp-1">
                            {item.name}
                          </h3>
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/30 dark:to-teal-800/20 flex items-center justify-center font-bold text-xs text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                            {item.rank}
                          </span>
                        </div>
                        {/* Change and Percentage - Inside Card */}
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-semibold text-xs px-2 py-1 rounded-md",
                              item.change >= 0
                                ? "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30"
                                : "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
                            )}
                          >
                            {formatChange(item.change, item.change_percent)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {entity !== "organizations" && (
            <div className="space-y-3 max-w-4xl mx-auto">
              {snapshot.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-5 bg-card border border-border rounded-xl hover:shadow-lg hover:border-accent transition-all duration-200"
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/30 dark:to-teal-800/20 flex items-center justify-center font-bold text-base text-teal-700 dark:text-teal-300 border-2 border-teal-200 dark:border-teal-700">
                      {item.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-lg mb-1 truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Current: <span className="font-medium text-foreground">{item.current_value}</span> • Previous: <span className="font-medium text-foreground">{item.previous_value}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right ml-4">
                    <span
                      className={cn(
                        "font-semibold text-sm px-3 py-1.5 rounded-md inline-block",
                        item.change >= 0
                          ? "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30"
                          : "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
                      )}
                    >
                      {formatChange(item.change, item.change_percent)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
