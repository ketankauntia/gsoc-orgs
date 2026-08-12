import Link from "next/link";
import { ArrowUpRight, Building2, CalendarDays, FileText } from "lucide-react";
import type { PublicProposal } from "@/lib/proposals/queries";

export function ProposalCard({ proposal }: { proposal: PublicProposal }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" /> GSoC {proposal.year}</span>
        <span className="inline-flex items-center gap-1.5"><FileText className="size-3.5" /> PDF</span>
      </div>
      <h2 className="mt-5 text-xl font-semibold leading-snug tracking-tight">
        <Link href={`/proposals/${proposal.public_slug}`} className="after:absolute after:inset-0">{proposal.project_title}</Link>
      </h2>
      <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="size-4" /> {proposal.organization_name}</p>
      {proposal.abstract_short ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{proposal.abstract_short}</p> : null}
      <div className="mt-auto flex items-end justify-between gap-4 pt-7">
        <div>
          <p className="text-xs text-muted-foreground">Shared by</p>
          <p className="mt-1 text-sm font-medium">{proposal.display_name}</p>
        </div>
        <ArrowUpRight className="size-5 text-muted-foreground transition group-hover:text-foreground" />
      </div>
    </article>
  );
}
