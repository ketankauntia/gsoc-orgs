import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { ContributorBlogsView } from "@/components/cobalt/views/community";
import { getContributorBlogs } from "@/lib/contributor-blogs";
import { getArchiveFacets } from "@/lib/proposals/archive-search";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "GSoC Contributor Project Blogs",
  description:
    "Follow selected Google Summer of Code contributors as they document weekly project progress, technical decisions, lessons learned, and final outcomes.",
  path: "/contributor-blogs",
});

type SearchParams = { year?: string; organization?: string };

export default async function ContributorBlogsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const year = Number.parseInt(params.year ?? "", 10);
  const [blogs, facets] = await Promise.all([
    getContributorBlogs({ year: Number.isFinite(year) ? year : undefined, organization: params.organization || undefined }),
    getArchiveFacets(),
  ]);
  return <ContributorBlogsView params={params} blogs={blogs} facets={facets} />;
}
