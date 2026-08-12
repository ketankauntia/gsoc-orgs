import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, Download, ExternalLink, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { getApprovedProposal } from "@/lib/proposals/queries";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const proposal = await getApprovedProposal((await params).slug);
  if (!proposal) return { title: "Proposal not found" };
  return { title: `${proposal.project_title} — GSoC ${proposal.year} Proposal`, description: `Accepted GSoC ${proposal.year} proposal for ${proposal.organization_name}, shared by ${proposal.display_name}.`, alternates: { canonical: `/proposals/${proposal.public_slug}` } };
}

export default async function ProposalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const proposal = await getApprovedProposal((await params).slug);
  if (!proposal) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: proposal.project_title,
    url: `${SITE_URL}/proposals/${proposal.public_slug}`,
    author: { "@type": "Person", name: proposal.display_name },
    contributor: proposal.archived_contributor_name,
    copyrightNotice: "Licensed under CC BY 4.0",
    license: "https://creativecommons.org/licenses/by/4.0/",
    datePublished: proposal.approved_at,
    about: [{ "@type": "Organization", name: proposal.organization_name }, `Google Summer of Code ${proposal.year}`],
  };
  return (
    <>
      <Header />
      <main className="min-h-screen pt-28">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <article className="mx-auto max-w-6xl px-6 py-12 lg:px-12">
          <Link href="/proposals" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All proposals</Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" /> GSoC {proposal.year}</span><span className="inline-flex items-center gap-1.5"><Building2 className="size-4" /> {proposal.organization_name}</span></div>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{proposal.project_title}</h1>
              {proposal.abstract_short ? <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{proposal.abstract_short}</p> : null}
              <div className="mt-10 overflow-hidden rounded-2xl border bg-muted/30">
                <iframe title={`${proposal.project_title} proposal PDF`} src={`/api/v2/proposals/${proposal.id}/pdf#toolbar=1`} className="h-[75vh] w-full" sandbox="allow-same-origin allow-downloads" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">PDF preview is sandboxed. If your browser cannot display it, use the download button.</p>
            </div>
            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Shared by</p>
                {proposal.avatar_r2_key ? <Image src={`/api/v2/proposals/${proposal.id}/avatar`} width={56} height={56} alt="" className="mb-4 size-14 rounded-full object-cover" unoptimized /> : null}
                <h2 className="mt-2 text-xl font-semibold">{proposal.display_name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Archived contributor: {proposal.archived_contributor_name}</p>
                {proposal.bio ? <p className="mt-4 text-sm leading-6 text-muted-foreground">{proposal.bio}</p> : null}
                {proposal.profile_links.length ? <div className="mt-5 flex flex-wrap gap-2">{proposal.profile_links.map((link) => <a key={`${link.platform}-${link.url}`} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs hover:bg-accent">{link.label || link.platform}<ExternalLink className="size-3" /></a>)}</div> : null}
              </div>
              <div className="rounded-2xl border bg-card p-6">
                <div className="flex items-center gap-2 font-medium"><ShieldCheck className="size-5 text-primary" /> Verified submission</div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">A moderator matched this submission to the archived contributor record. It is not an official endorsement by Google or the organization.</p>
                <Button asChild className="mt-5 w-full"><a href={`/api/v2/proposals/${proposal.id}/pdf`}><Download className="size-4" /> Open PDF</a></Button>
              </div>
              <p className="px-2 text-xs leading-5 text-muted-foreground">The contributor retains copyright and publishes this document under <a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer">CC BY 4.0</a>.</p>
            </aside>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
