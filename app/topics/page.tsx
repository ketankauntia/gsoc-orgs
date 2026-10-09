import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { loadTopicsIndexData } from "@/lib/topics-page-types";
import { TopicsIndexView } from "@/components/cobalt/views/topics";

export const revalidate = 2592000; // 30 days

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "GSoC Topics & Categories",
    description:
      "Browse Google Summer of Code organizations and projects by topic, from machine learning to developer tooling, and find the area that fits your skills.",
    path: "/topics",
  });
}

export default async function TopicsPage() {
  const data = await loadTopicsIndexData();
  if (!data) throw new Error("Topics index data is missing.");
  return <TopicsIndexView data={data} />;
}
