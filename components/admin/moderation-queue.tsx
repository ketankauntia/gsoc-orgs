"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type QueueItem = { id: string; status: string; submitted_at?: string; profiles?: { display_name?: string }; contributor_claims?: { status?: string; year?: number; project_contributors?: { archived_name?: string; projects?: { title?: string; organizations?: { name?: string } } } } };

export function ModerationQueue() {
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); void fetch(`/api/v2/admin/proposals?status=${status}`, { cache: "no-store" }).then((response) => response.json()).then(({ data }) => setItems(data ?? [])).finally(() => setLoading(false)); }, [status]);
  return <div><div className="flex flex-wrap gap-2">{["pending","changes_requested","approved","rejected","draft","withdrawn"].map((value) => <Button key={value} size="sm" variant={status === value ? "default" : "outline"} onClick={() => setStatus(value)}>{value.replaceAll("_", " ")}</Button>)}</div><div className="mt-6 space-y-3">{loading ? <div className="h-32 animate-pulse rounded-2xl bg-muted" /> : items.length ? items.map((item) => { const claim = item.contributor_claims; const project = claim?.project_contributors?.projects; return <Link href={`/admin/proposals/${item.id}`} key={item.id} className="block rounded-2xl border bg-card p-5 transition hover:bg-accent/30"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Proposal {item.status} · claim {claim?.status}</p><h2 className="mt-2 text-lg font-semibold">{project?.title ?? "Proposal"}</h2><p className="mt-1 text-sm text-muted-foreground">GSoC {claim?.year} · {project?.organizations?.name} · archived as {claim?.project_contributors?.archived_name}</p></div><div className="text-right text-sm"><p className="font-medium">{item.profiles?.display_name}</p><p className="mt-1 text-xs text-muted-foreground">{item.submitted_at ? new Date(item.submitted_at).toLocaleString() : "Not submitted"}</p></div></div></Link>; }) : <div className="rounded-2xl border border-dashed py-14 text-center text-muted-foreground">No proposals in this queue.</div>}</div></div>;
}
