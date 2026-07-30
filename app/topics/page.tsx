import { Metadata } from "next";
import {
  Heading,
  Text,
} from "@/components/ui";
import { getFullUrl } from "@/lib/constants";
import { loadTopicsIndexData } from "@/lib/topics-page-types";
import { TopicsClient } from "./topics-client";
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs";

/**
 * Topics Index Page
 * Route: /topics
 * 
 * Shows all available GSoC topics/categories with:
 * - Search functionality (client-side)
 * - Topic cards with org/project counts
 * - Derived from organizations.topics[] data
 * 
 * Uses static JSON - no API calls, no Prisma queries.
 */
export const revalidate = 3600; // 1 hour

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "GSoC Topics & Categories - Google Summer of Code Organizations Guide",
    description:
      "Browse topic labels recorded across Google Summer of Code organizations and projects. Review organization coverage, project totals, and active years.",
    alternates: {
      canonical: getFullUrl("/topics"),
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: "GSoC Topics & Categories",
      description:
        "Browse topic labels recorded across Google Summer of Code organizations and projects",
      url: getFullUrl("/topics"),
      type: "website",
      siteName: "GSoC Organizations Guide",
    },
    twitter: {
      card: "summary_large_image",
      title: "GSoC Topics & Categories",
      description:
        "Browse topic labels recorded across Google Summer of Code organizations and projects",
    },
  };
}

export default async function TopicsPage() {
  // Load static JSON data
  const indexData = await loadTopicsIndexData();

  if (!indexData) {
    return (
      <div
        className="atlas-corner-marks flex min-h-[28rem] items-center justify-center border border-border bg-card p-8"
        role="alert"
      >
        <div className="text-center">
          <Heading as="h1" variant="subsection">
            Topic data is unavailable.
          </Heading>
          <Text className="mt-4 text-muted-foreground">
            The generated topic index could not be loaded.
          </Text>
        </div>
      </div>
    );
  }

  const topTopics = [...indexData.topics]
    .sort(
      (a, b) =>
        b.organizationCount - a.organizationCount ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 6);
  const snapshotDate = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(indexData.published_at));

  return (
    <div>
      <SiteBreadcrumbs
        items={[{ label: "Topics", href: "/topics" }]}
        className="pb-6 pt-1"
      />
      <TopicsClient
        topics={indexData.topics}
        topTopics={topTopics}
        total={indexData.total}
        snapshotDate={snapshotDate}
      />
    </div>
  );
}
