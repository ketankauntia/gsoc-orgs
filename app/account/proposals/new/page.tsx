import type { Metadata } from "next";
import { Suspense } from "react";
import { ProposalWizard } from "@/components/account/proposal-wizard";

export const metadata: Metadata = { title: "Share a GSoC proposal", robots: { index: false, follow: false } };

export default function NewProposalPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20 lg:px-12">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-medium text-primary">Verified community archive</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Share your accepted GSoC proposal</h1>
        <p className="mt-4 text-muted-foreground">
          Two steps: point us at your archived selection, then upload the accepted PDF. Everything stays private until
          a moderator verifies the claim. A contributor account may claim at most two GSoC selection years.
        </p>
      </div>
      <Suspense fallback={<div className="rounded-3xl border bg-card p-8 text-sm text-muted-foreground">Loading the archive…</div>}>
        <ProposalWizard />
      </Suspense>
    </main>
  );
}
