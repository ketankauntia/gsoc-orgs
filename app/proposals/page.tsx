import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/header";
import { ArchiveResultCard } from "@/components/proposals/archive-result-card";
import { ArchiveSearchForm } from "@/components/proposals/archive-search-form";
import { ProposalCard } from "@/components/proposals/proposal-card";
import { Button } from "@/components/ui/button";
import { getArchiveFacets, searchArchive } from "@/lib/proposals/archive-search";
import { getApprovedProposals } from "@/lib/proposals/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Search GSoC Projects and Accepted Proposals",
  description:
    "Search archived Google Summer of Code projects by year, organization, and technology, and read accepted proposals shared by past contributors.",
  path: "/proposals",
});

type SearchParams = { q?: string; year?: string; organization?: string; technology?: string; page?: string };

export default async function ProposalsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const year = Number.parseInt(params.year ?? "", 10);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const hasQuery = Boolean(params.q || params.year || params.organization || params.technology);

  const facets = await getArchiveFacets();
  const [results, latest] = await Promise.all([
    hasQuery
      ? searchArchive({
          q: params.q,
          year: Number.isFinite(year) ? year : undefined,
          organization: params.organization,
          technology: params.technology,
          page,
        })
      : Promise.resolve(null),
    hasQuery ? Promise.resolve(null) : getApprovedProposals({ page: 1 }),
  ]);

  const pageCount = results ? Math.max(1, Math.ceil(results.total / results.limit)) : 1;
  const pageHref = (nextPage: number) => {
    const query = new URLSearchParams();
    for (const key of ["q", "year", "organization", "technology"] as const) if (params[key]) query.set(key, params[key]!);
    query.set("page", String(nextPage));
    return `/proposals?${query}`;
  };

  return (
    <>
      <Header />
      <main className="min-h-screen pt-28">
        <section className="border-b bg-linear-to-b from-primary/8 to-background">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-12">
            <p className="text-sm font-semibold text-primary">Community proposal archive</p>
            <div className="mt-3 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  Find the GSoC project you care about — then read the proposal behind it.
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                  Search all {facets.totals.projects.toLocaleString("en-IN")} archived selections
                  {facets.totals.firstYear && facets.totals.lastYear
                    ? ` from ${facets.totals.firstYear} to ${facets.totals.lastYear}`
                    : ""}. Reading needs no account. If one of these projects is yours, you can share the proposal that
                  won it.
                </p>
              </div>
              <Button asChild size="lg" variant="outline">
                <Link href="/share-proposal">Share your proposal</Link>
              </Button>
            </div>

            <div className="mt-9">
              <ArchiveSearchForm
                facets={facets}
                initial={{
                  year: params.year ?? "",
                  q: params.q ?? "",
                  organization: params.organization ?? "",
                  technology: params.technology ?? "",
                }}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12 lg:px-12">
          {results ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {results.total.toLocaleString("en-IN")} {results.total === 1 ? "project" : "projects"}
                </h2>
                {hasQuery ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/proposals">Clear filters</Link>
                  </Button>
                ) : null}
              </div>

              {results.technologyOrganizations ? (
                <p className="mt-4 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                  GSoC publishes technologies on the organization profile, not on individual projects — so this shows
                  every project at the {results.technologyOrganizations.toLocaleString("en-IN")} organizations that
                  work with it
                  {results.technologyOrganizations > facets.organizations.length / 3
                    ? ". That is a large share of the archive; add a year or an organization to narrow it."
                    : "."}
                </p>
              ) : null}

              {results.data.length ? (
                <>
                  <div className="mt-6 space-y-4">
                    {results.data.map((result) => (
                      <ArchiveResultCard key={result.projectId} result={result} />
                    ))}
                  </div>
                  {pageCount > 1 ? (
                    <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Result pages">
                      <Button asChild variant="outline" className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
                        <Link href={pageHref(Math.max(1, page - 1))}>Previous</Link>
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {page} of {pageCount.toLocaleString("en-IN")}
                      </span>
                      <Button asChild variant="outline" className={page >= pageCount ? "pointer-events-none opacity-50" : ""}>
                        <Link href={pageHref(Math.min(pageCount, page + 1))}>Next</Link>
                      </Button>
                    </nav>
                  ) : null}
                </>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed px-6 py-16 text-center">
                  <h3 className="text-xl font-semibold">Nothing matched those filters</h3>
                  <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                    Try removing the project title, or widening the year. Organization and technology are picked from
                    real archive values, so those two are never misspelled.
                  </p>
                  <Button asChild variant="outline" className="mt-7">
                    <Link href="/proposals">Start over</Link>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold tracking-tight">Recently shared proposals</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Every document here is matched to an archived GSoC selection and published only after contributor
                submission or recorded publication permission, plus moderator review.
              </p>
              {latest?.data.length ? (
                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {latest.data.map((proposal) => (
                    <ProposalCard key={proposal.id} proposal={proposal} />
                  ))}
                </div>
              ) : (
                <div className="mt-8 rounded-3xl border border-dashed px-6 py-16 text-center">
                  <h3 className="text-xl font-semibold">No proposals shared yet</h3>
                  <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                    The library only publishes manually verified submissions. Search the archive above to find your own
                    selection and be among the first to share one.
                  </p>
                  <Button asChild className="mt-7">
                    <Link href="/share-proposal">Share a proposal</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
