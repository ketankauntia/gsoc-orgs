"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type AuditEvent = { id: string; action: string; created_at: string; reason?: string | null };
type Detail = {
  status: string;
  profiles?: { display_name?: string };
  contributor_claims?: {
    status: string;
    year: number;
    claimant_note?: string | null;
    evidence_urls?: string[];
    project_contributors?: {
      archived_name: string;
      projects?: { title: string; organizations?: { name: string } };
    };
  };
  moderationEvents?: AuditEvent[];
};

export function ModerationDetail({ id }: { id: string }) {
  const [detail, setDetail] = useState<Detail>();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/v2/admin/proposals/${id}`, { cache: "no-store" });
    const body = await response.json();
    setDetail(body.data);
    if (!response.ok) setMessage(body.error?.message);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function decide(decision: string) {
    setBusy(true);
    setMessage("Saving decision…");
    const response = await fetch(`/api/v2/admin/proposals/${id}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason }),
    });
    const body = await response.json();
    setMessage(response.ok ? "Decision saved." : body.error?.message ?? "Decision failed");
    setBusy(false);
    if (response.ok) await load();
  }

  if (!detail) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  const claim = detail.contributor_claims;
  const slot = claim?.project_contributors;
  const project = slot?.projects;
  const organization = project?.organizations;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <section className="rounded-2xl border bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{detail.status} · claim {claim?.status}</p>
          <h1 className="mt-3 text-3xl font-semibold">{project?.title}</h1>
          <p className="mt-2 text-muted-foreground">GSoC {claim?.year} · {organization?.name}</p>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Authenticated profile</dt><dd className="mt-1 font-medium">{detail.profiles?.display_name}</dd></div>
            <div><dt className="text-muted-foreground">Archived contributor</dt><dd className="mt-1 font-medium">{slot?.archived_name}</dd></div>
          </dl>
          {claim?.claimant_note ? <div className="mt-5 rounded-xl bg-muted p-4 text-sm"><p className="font-medium">Private claimant note</p><p className="mt-2 whitespace-pre-wrap text-muted-foreground">{claim.claimant_note}</p></div> : null}
          {claim?.evidence_urls?.length ? <div className="mt-5"><p className="text-sm font-medium">Private evidence</p><ul className="mt-2 space-y-1 text-sm">{claim.evidence_urls.map((url) => <li key={url}><a className="break-all underline" target="_blank" rel="noopener noreferrer" href={url}>{url}</a></li>)}</ul></div> : null}
        </section>
        <section className="overflow-hidden rounded-2xl border bg-muted/30"><iframe title="Private proposal PDF" src={`/api/v2/admin/proposals/${id}/pdf#toolbar=1`} className="h-[70vh] w-full" sandbox="allow-same-origin allow-downloads" /></section>
      </div>
      <aside className="space-y-5">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">Moderation decision</h2>
          <label className="mt-4 block text-sm font-medium">Private reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-28 w-full rounded-md border bg-transparent p-3 text-sm" placeholder="Required for rejection, changes, or reopening" /></label>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button disabled={busy} variant="outline" onClick={() => decide("verify_claim")}>Verify claim</Button>
            <Button disabled={busy} variant="destructive" onClick={() => decide("reject_claim")}>Reject claim</Button>
            <Button disabled={busy} variant="outline" onClick={() => decide("request_changes")}>Request changes</Button>
            <Button disabled={busy} onClick={() => decide("approve")}>Approve</Button>
            <Button disabled={busy} variant="destructive" onClick={() => decide("reject")}>Reject PDF</Button>
            <Button disabled={busy} variant="outline" onClick={() => decide("reopen")}>Reopen</Button>
          </div>
          {message ? <p role="status" className="mt-4 rounded-lg bg-muted p-3 text-sm">{message}</p> : null}
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold">Audit history</h2>
          <div className="mt-4 space-y-3">{(detail.moderationEvents ?? []).map((event) => <div key={event.id} className="border-l-2 pl-3 text-sm"><p className="font-medium">{event.action.replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>{event.reason ? <p className="mt-1 text-muted-foreground">{event.reason}</p> : null}</div>)}</div>
        </section>
        <Button asChild variant="ghost"><Link href="/admin/proposals">Back to queue</Link></Button>
      </aside>
    </div>
  );
}
