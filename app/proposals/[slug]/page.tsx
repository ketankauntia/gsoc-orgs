import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProposalDetailView } from "@/components/cobalt/views/community";
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
  return <ProposalDetailView proposal={proposal} jsonLd={jsonLd} />;
}
