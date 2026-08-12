import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/header";
import { ProposalCard } from "@/components/proposals/proposal-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApprovedProposals } from "@/lib/proposals/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Accepted GSoC Proposals",
  description: "Browse contributor-submitted and manually verified Google Summer of Code proposal PDFs by year, organization, and project.",
  alternates: { canonical: "/proposals" },
};

export default async function ProposalsPage({ searchParams }: { searchParams: Promise<{ q?: string; year?: string; organization?: string; project?: string; page?: string }> }) {
  const params = await searchParams;
  const year = Number.parseInt(params.year ?? "", 10);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const result = await getApprovedProposals({ q: params.q, year: Number.isFinite(year) ? year : undefined, organization: params.organization, project: params.project, page });
  const pageCount = Math.max(1, Math.ceil(result.total / result.limit));
  const pageHref = (nextPage: number) => {
    const query = new URLSearchParams();
    for (const key of ["q", "year", "organization", "project"] as const) if (params[key]) query.set(key, params[key]!);
    query.set("page", String(nextPage));
    return `/proposals?${query}`;
  };
  return (
    <>
      <Header />
      <main className="min-h-screen pt-28">
        <section className="border-b bg-linear-to-b from-primary/8 to-background">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-12">
            <p className="text-sm font-semibold text-primary">Community proposal archive</p>
            <div className="mt-3 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Learn from proposals that became real GSoC projects.</h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Every document here was submitted by a contributor, matched to an archived GSoC selection, and approved by a moderator.</p>
              </div>
              <Button asChild size="lg"><Link href="/account/proposals/new">Share your proposal</Link></Button>
            </div>
            <form className="mt-10 grid max-w-4xl gap-3 rounded-2xl border bg-background/90 p-3 shadow-sm sm:grid-cols-[1fr_120px_180px_auto]">
              <label className="relative"><span className="sr-only">Search projects</span><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input name="q" defaultValue={params.q} className="pl-9" placeholder="Search by project title" /></label>
              <Input name="year" type="number" min="2016" max="2025" defaultValue={params.year} placeholder="Year" aria-label="GSoC year" />
              <Input name="organization" defaultValue={params.organization} placeholder="Organization slug" aria-label="Organization slug" />
              <Button type="submit">Search</Button>
            </form>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-6 py-14 lg:px-12">
          {result.data.length ? (
            <><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{result.data.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} />)}</div>
            {pageCount > 1 ? <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Proposal result pages"><Button asChild variant="outline" className={page <= 1 ? "pointer-events-none opacity-50" : ""}><Link href={pageHref(Math.max(1, page - 1))}>Previous</Link></Button><span className="text-sm text-muted-foreground">Page {page} of {pageCount}</span><Button asChild variant="outline" className={page >= pageCount ? "pointer-events-none opacity-50" : ""}><Link href={pageHref(Math.min(pageCount, page + 1))}>Next</Link></Button></nav> : null}</>
          ) : (
            <div className="rounded-3xl border border-dashed px-6 py-20 text-center">
              <h2 className="text-2xl font-semibold">No approved proposals match yet</h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">The library only publishes manually verified submissions. Try a broader search, or be among the first contributors to share one.</p>
              <Button asChild className="mt-7"><Link href="/account/proposals/new">Share a proposal</Link></Button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
