import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { ProposalsView, type ProposalParams } from "@/components/cobalt/views/community";
import { getArchiveFacets, searchArchive } from "@/lib/proposals/archive-search";
import { getApprovedProposals } from "@/lib/proposals/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Search GSoC Projects and Accepted Proposals",
  description:
    "Search archived Google Summer of Code projects by year, organization, and technology, and read accepted proposals shared by past contributors.",
  path: "/proposals",
});

export default async function ProposalsPage({ searchParams }: { searchParams: Promise<ProposalParams> }) {
  const params = await searchParams;
  const year = Number.parseInt(params.year ?? "", 10);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const hasQuery = Boolean(params.q || params.year || params.organization || params.technology);

  const [facets, results, latest] = await Promise.all([
    getArchiveFacets(),
    hasQuery
      ? searchArchive({
          q: params.q,
          year: Number.isFinite(year) ? year : undefined,
          organization: params.organization,
          technology: params.technology,
          page,
        })
      : Promise.resolve(null),
    hasQuery
      ? Promise.resolve(null)
      : getApprovedProposals({ page: 1 }).catch((error) => {
          console.error("[proposals] latest proposals unavailable", error);
          return null;
        }),
  ]);

  return <ProposalsView params={params} facets={facets} results={results} latest={latest} page={page} />;
}
