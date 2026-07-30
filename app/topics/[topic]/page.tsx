import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getFullUrl } from "@/lib/constants";
import { loadTopicData } from "@/lib/topics-page-types";
import { TopicPageClient } from "./topic-client";
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs";

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
    description: `Browse ${topicData.organizationCount} Google Summer of Code organization records and ${topicData.projectCount} projects tagged ${topicData.name}.`,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${topicData.name} - GSoC Topics`,
      description: `Browse archived organization and project records tagged ${topicData.name}.`,
      url: getFullUrl(`/topics/${topicSlug}`),
      type: "website",
      siteName: "GSoC Organizations Guide",
    },
    twitter: {
      card: "summary_large_image",
      title: `${topicData.name} - GSoC Topics`,
      description: `Browse archived organization and project records tagged ${topicData.name}.`,
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
    <div>
      <SiteBreadcrumbs
        items={[
          { label: "Topics", href: "/topics" },
          { label: topicData.name, href: `/topics/${topicSlug}` },
        ]}
        className="pb-6 pt-1"
      />
      <TopicPageClient topic={topicData} />
    </div>
  );
}
