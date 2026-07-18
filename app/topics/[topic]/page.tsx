import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getFullUrl } from "@/lib/constants";
import { loadTopicData } from "@/lib/topics-page-types";
import { TopicPageClient } from "./topic-client";
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs";

/**
 * Topic Detail Page
 * Route: /topics/[topic]
 * 
 * Shows all organizations with a specific topic/tag:
 * - Topic overview with stats
 * - List of organizations
 * - Yearly statistics
 * 
 * Uses static JSON by default, falls back to API if JSON not available.
 */
export const revalidate = 2592000; // 30 days

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic: topicSlug } = await params;
  const topicData = await loadTopicData(topicSlug);

  if (!topicData) {
    return {
      title: "Topic Not Found - GSoC Organizations Guide",
    };
  }

  return {
    title: `${topicData.name} - GSoC Topics - Google Summer of Code Organizations Guide`,
    description: `Explore ${topicData.organizationCount} Google Summer of Code organizations working on ${topicData.name}. Find projects, opportunities, and resources.`,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${topicData.name} - GSoC Topics`,
      description: `Explore ${topicData.organizationCount} Google Summer of Code organizations working on ${topicData.name}.`,
      url: getFullUrl(`/topics/${topicSlug}`),
      type: "website",
      siteName: "GSoC Organizations Guide",
    },
    twitter: {
      card: "summary_large_image",
      title: `${topicData.name} - GSoC Topics`,
      description: `Explore ${topicData.organizationCount} Google Summer of Code organizations working on ${topicData.name}.`,
    },
    alternates: {
      canonical: getFullUrl(`/topics/${topicSlug}`),
    },
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic: topicSlug } = await params;
  const topicData = await loadTopicData(topicSlug);

  if (!topicData) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <SiteBreadcrumbs
        items={[
          { label: "Topics", href: "/topics" },
          { label: topicData.name, href: `/topics/${topicSlug}` },
        ]}
      />
      <TopicPageClient topic={topicData} />
    </div>
  );
}
