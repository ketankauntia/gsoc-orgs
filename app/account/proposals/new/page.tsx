import type { Metadata } from "next";
import { ProposalWizard } from "@/components/account/proposal-wizard";

export const metadata: Metadata = { title: "Share a GSoC proposal", robots: { index: false, follow: false } };

export default function NewProposalPage() {
  return <main className="mx-auto max-w-5xl px-6 pb-20 lg:px-12"><div className="mb-10 max-w-3xl"><p className="text-sm font-medium text-primary">Verified community archive</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Share your accepted GSoC proposal</h1><p className="mt-4 text-muted-foreground">Choose the exact archived project, upload the accepted PDF privately, and submit it for manual verification. A contributor account may claim at most two GSoC selection years.</p></div><ProposalWizard /></main>;
}
