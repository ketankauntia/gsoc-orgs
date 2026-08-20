import { notFound, permanentRedirect } from "next/navigation";
import { Metadata } from "next";
import { buildNotFoundMetadata, buildPageMetadata } from "@/lib/seo";
import { loadTopicData } from "@/lib/topics-page-types";
import { TopicPageClient } from "./topic-client";
import { canonicalSlugForPath } from "@/lib/vocabulary/catalog";
import { isTaxonomyIndexEligible } from "@/lib/search-index-policy";

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
  const canonicalSlug = canonicalSlugForPath("topic", topicSlug) ?? topicSlug;
  const topicData = await loadTopicData(canonicalSlug);

  if (!topicData) {
    return buildNotFoundMetadata("Topic");
  }

  const indexable = isTaxonomyIndexEligible(topicData.organizationCount, topicData.projectCount);

  return buildPageMetadata({
    title: [`${topicData.name} - GSoC Organizations`, `${topicData.name} in GSoC`],
    description: `Explore ${topicData.organizationCount} Google Summer of Code organizations working on ${topicData.name}.`,
    descriptionExtras: [
      `Browse ${topicData.projectCount} accepted projects in this area`,
      "Compare organizations, technologies, and contributor opportunities before you apply",
    ],
    path: `/topics/${canonicalSlug}`,
    index: indexable,
  });
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic: topicSlug } = await params;
  const canonicalSlug = canonicalSlugForPath("topic", topicSlug);
  if (canonicalSlug && canonicalSlug !== topicSlug) {
    permanentRedirect(`/topics/${canonicalSlug}`);
  }
  const topicData = await loadTopicData(topicSlug);

  if (!topicData) {
    notFound();
  }

  return <TopicPageClient topic={topicData} />;
}
