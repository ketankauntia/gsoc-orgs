import type { Metadata } from "next";
import { CobaltDirectory } from "@/components/cobalt/directory";
import { buildPageMetadata } from "@/lib/seo";

/**
 * Organization directory. Filters live in the URL (q, scope, tech, topic, year, category, new,
 * cap, rec, sort, page, view); the earlier parameter names (techs, topics, categories, years,
 * firstTimeOnly) are still accepted. The WebSite SearchAction on the home page targets ?q=.
 */
export async function generateMetadata({ searchParams }: PageProps<"/organizations">): Promise<Metadata> {
  const params = await searchParams;
  const page = Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1;
  return buildPageMetadata({
    title: page === 1 ? "All GSoC Organizations" : `GSoC Organizations - Page ${page}`,
    description:
      "Explore every Google Summer of Code participating organization. Filter by technology, topic, and year to find the right match for your skills.",
    path: "/organizations",
  });
}

export default async function OrganizationsPage({ searchParams }: PageProps<"/organizations">) {
  return <CobaltDirectory params={await searchParams} />;
}
