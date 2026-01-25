import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Heading,
  Text,
} from "@/components/ui";
import { getFullUrl } from "@/lib/constants";
import {
  loadTrendingSnapshot,
  isValidTrendingEntity,
  isValidTrendingRange,
  type TrendingRange,
} from "@/lib/trending-types";
import { TrendingPageClient } from "./trending-page-client";

/**
 * Trending Page
 * Route: /trending/:entity
 * 
 * Shows trending snapshots of entities over time.
 * Supported entities: organizations | projects | tech-stack | topics
 * Time range is selected via ?range=daily|weekly|monthly|yearly
 * 
 * Uses static JSON snapshots - no API calls, no database queries.
 */
export const revalidate = 3600; // 1 hour

interface PageProps {
  params: Promise<{ entity: string }>;
  searchParams: Promise<{ 
    range?: string;
    year?: string;
    month?: string;
  }>;
}

export async function generateStaticParams() {
  return [
    { entity: "organizations" },
    { entity: "projects" },
    { entity: "tech-stack" },
    { entity: "topics" },
  ];
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { entity } = await params;
  const { range, year, month } = await searchParams;

  if (!isValidTrendingEntity(entity)) {
    return {
      title: "Trending - GSoC Organizations Guide",
    };
  }

  const validRange: TrendingRange = isValidTrendingRange(range ?? null) ? (range as TrendingRange) : "monthly";
  const entityName = entity === "tech-stack" ? "Tech Stack" : entity.charAt(0).toUpperCase() + entity.slice(1);
  const rangeName = validRange.charAt(0).toUpperCase() + validRange.slice(1);
  const isArchive = year !== undefined;

  let title: string;
  let description: string;

  if (isArchive) {
    const yearNum = parseInt(year || "", 10);
    const monthNum = month ? parseInt(month, 10) : undefined;
    const monthName = monthNum
      ? new Date(2000, monthNum - 1).toLocaleString("default", { month: "long" })
      : "";
    const archiveLabel = monthNum ? `${monthName} ${yearNum}` : `${yearNum}`;
    
    title = `Trending ${entityName} - ${archiveLabel} Archive - GSoC Organizations Guide`;
    description = `Historical trending data for ${entityName.toLowerCase()} in Google Summer of Code ${archiveLabel}. Explore archived snapshots and see how trends have evolved.`;
  } else {
    title = `Trending ${entityName} - ${rangeName} - GSoC Organizations Guide`;
    description = `Discover trending ${entityName.toLowerCase()} in Google Summer of Code. See what's gaining momentum ${validRange === "daily" ? "today" : validRange === "weekly" ? "this week" : validRange === "monthly" ? "this month" : "this year"}.`;
  }

  const paramsObj = new URLSearchParams();
  if (validRange !== "monthly") paramsObj.set("range", validRange);
  if (year) paramsObj.set("year", year);
  if (month) paramsObj.set("month", month);
  const queryString = paramsObj.toString();
  const canonicalUrl = getFullUrl(`/trending/${entity}${queryString ? `?${queryString}` : ""}`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `Trending ${entityName} - ${rangeName}`,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "GSoC Organizations Guide",
      images: [
        {
          url: getFullUrl("/og/gsoc-organizations-guide.jpg"),
          width: 1200,
          height: 630,
          alt: "GSoC Organizations Guide",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Trending ${entityName} - ${rangeName}`,
      description,
      images: [getFullUrl("/og/gsoc-organizations-guide.jpg")],
    },
  };
}

export default async function TrendingPage({
  params,
  searchParams,
}: PageProps) {
  const { entity } = await params;
  const { range, year, month } = await searchParams;

  if (!isValidTrendingEntity(entity)) {
    notFound();
  }

  const validRange: TrendingRange = isValidTrendingRange(range ?? null)
    ? (range as TrendingRange)
    : "monthly";

  const yearNum = year ? parseInt(year, 10) : undefined;
  const monthNum = month ? parseInt(month, 10) : undefined;

  const snapshot = await loadTrendingSnapshot(
    entity,
    validRange,
    yearNum,
    monthNum
  );

  if (!snapshot) {
    return (
      <div className="container mx-auto px-4 py-16 lg:py-24 max-w-4xl">
        <div className="text-center">
          <Heading variant="section" className="mb-4 text-2xl lg:text-3xl">
            Trending data not available
          </Heading>
          <Text className="mt-4 text-muted-foreground text-base max-w-md mx-auto">
            The trending snapshot for {entity} ({validRange}) has not been generated yet.
            <br />
            <br />
            Please run the trending data generation script to populate this page.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <TrendingPageClient
      entity={entity}
      snapshot={snapshot}
      currentRange={validRange}
      archiveYear={yearNum}
      archiveMonth={monthNum}
    />
  );
}
