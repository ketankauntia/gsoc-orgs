import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { buildNotFoundMetadata, buildPageMetadata } from "@/lib/seo";
import { loadTopicData, loadTopicsIndexData } from "@/lib/topics-page-types";
import { canonicalSlugForPath } from "@/lib/vocabulary/catalog";
import { isTaxonomyIndexEligible } from "@/lib/search-index-policy";
import { TopicDetailView } from "@/components/cobalt/views/topics";

export const revalidate = 2592000; // 30 days

// No paths at build time; each one is rendered on first visit and cached for the revalidate
// window. Without this export Next.js renders the route on every request (ISR needs it).
export async function generateStaticParams() {
  return [];
}

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

  const index = await loadTopicsIndexData();
  const topicSlugs = new Set((index?.topics ?? []).map((topic) => topic.slug));

  return <TopicDetailView data={topicData} topicSlugs={topicSlugs} />;
}
