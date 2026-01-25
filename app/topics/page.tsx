import { Metadata } from "next";
import {
  Heading,
  Text,
} from "@/components/ui";
import { getFullUrl } from "@/lib/constants";
import { loadTopicsIndexData } from "@/lib/topics-page-types";
import { TopicsClient } from "./topics-client";

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
    description: "Explore Google Summer of Code organizations and projects organized by topic. Find the perfect match for your skills and interests.",
    alternates: {
      canonical: getFullUrl("/topics"),
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: "GSoC Topics & Categories",
      description: "Explore Google Summer of Code organizations and projects organized by topic",
      url: getFullUrl("/topics"),
      type: "website",
      siteName: "GSoC Organizations Guide",
    },
    twitter: {
      card: "summary_large_image",
      title: "GSoC Topics & Categories",
      description: "Explore Google Summer of Code organizations and projects organized by topic",
    },
  };
}

export default async function TopicsPage() {
  // Load static JSON data
  const indexData = await loadTopicsIndexData();

  if (!indexData) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Heading variant="section">Failed to load topics</Heading>
          <Text className="mt-4 text-muted-foreground">
            Please try again later or run: pnpm generate:topics
          </Text>
        </div>
      </div>
    );
  }

  // Get top topics by organization count (for trending section)
  const trendingTopics = indexData.topics
    .slice(0, 6)
    .filter(topic => topic.organizationCount >= 10);

  return (
    <TopicsClient 
      topics={indexData.topics}
      trendingTopics={trendingTopics}
      total={indexData.total}
    />
  );
}
