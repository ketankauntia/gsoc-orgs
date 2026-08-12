"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { ProfileForm } from "@/components/account/profile-form";
import { Button } from "@/components/ui/button";

type Proposal = {
  id: string;
  status: string;
  current_file_id?: string | null;
  moderator_reason?: string | null;
  contributor_claims?: {
    status?: string;
    year?: number;
    project_contributors?: { projects?: { title?: string; organizations?: { name?: string } } };
  };
};

export function AccountDashboard() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const response = await fetch("/api/v2/me/proposals", { cache: "no-store" });
    const { data } = await response.json();
    setProposals(data ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const capacity = Math.max(0, 2 - proposals.filter((proposal) => proposal.contributor_claims?.status !== "rejected").length);

  async function remove(proposal: Proposal) {
    const verified = proposal.contributor_claims?.status === "verified";
    const label = verified ? "withdraw this proposal" : "delete this draft and release its claim slot";
    if (!window.confirm(`Are you sure you want to ${label}?`)) return;
    const response = await fetch(`/api/v2/me/proposals/${proposal.id}`, { method: "DELETE" });
    if (response.ok) await load();
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><p className="text-sm font-medium text-primary">Contributor profile</p><h2 className="mt-1 text-2xl font-semibold">Control what appears with approved proposals</h2></div>
          <span className="rounded-full bg-muted px-3 py-1 text-sm">{capacity} of 2 claim slots remaining</span>
        </div>
        <div className="mt-7"><ProfileForm /></div>
      </section>
      <section>
        <div className="flex items-end justify-between gap-5">
          <div><h2 className="text-2xl font-semibold">Your proposals</h2><p className="mt-2 text-sm text-muted-foreground">Files and personal evidence remain private until approval.</p></div>
          {capacity > 0 ? <Button asChild><Link href="/account/proposals/new"><FilePlus2 className="size-4" /> New proposal</Link></Button> : <Button disabled><FilePlus2 className="size-4" /> Claim limit reached</Button>}
        </div>
        <div className="mt-6 space-y-4">
          {loading ? <div className="h-32 animate-pulse rounded-2xl bg-muted" /> : proposals.length ? proposals.map((proposal) => {
            const claim = proposal.contributor_claims;
            const project = claim?.project_contributors?.projects;
            return (
              <article key={proposal.id} className="rounded-2xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{proposal.status.replaceAll("_", " ")} · claim {claim?.status}</p><h3 className="mt-2 text-lg font-semibold">{project?.title ?? "GSoC proposal"}</h3><p className="mt-1 text-sm text-muted-foreground">GSoC {claim?.year} · {project?.organizations?.name}</p></div>
                  <div className="flex gap-2">{proposal.current_file_id ? <Button asChild variant="outline" size="sm"><Link href={`/api/v2/me/proposals/${proposal.id}/pdf`}>Open PDF</Link></Button> : null}{["draft", "changes_requested"].includes(proposal.status) ? <Button variant="ghost" size="sm" onClick={() => remove(proposal)}>{claim?.status === "verified" ? "Withdraw" : "Delete draft"}</Button> : null}</div>
                </div>
                {proposal.moderator_reason ? <p className="mt-4 rounded-xl bg-muted p-3 text-sm"><strong>Moderator note:</strong> {proposal.moderator_reason}</p> : null}
              </article>
            );
          }) : <div className="rounded-2xl border border-dashed py-14 text-center"><p className="font-medium">You have not started a proposal submission.</p><p className="mt-2 text-sm text-muted-foreground">Choose an archived GSoC selection and upload the accepted PDF.</p></div>}
        </div>
      </section>
    </div>
  );
}
