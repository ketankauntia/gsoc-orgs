import Link from "next/link";
import { Building2, CalendarDays, FileCheck2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ArchiveResult } from "@/lib/proposals/archive-search";

/**
 * One archived GSoC selection. It is a reading link when someone has already
 * shared the proposal, and a claim invitation when nobody has — the same row
 * serves the reader and the contributor who owns it.
 */
export function ArchiveResultCard({ result }: { result: ArchiveResult }) {
  const claimHref = `/share-proposal?project=${encodeURIComponent(result.externalId)}&year=${result.year}`;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" /> GSoC {result.year}
          </span>
          <Link href={`/organizations/${result.organizationSlug}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
            <Building2 className="size-3.5" /> {result.organizationName}
          </Link>
          {result.proposalSlug ? (
            <span className="inline-flex items-center gap-1.5 text-primary">
              <FileCheck2 className="size-3.5" /> Proposal available
            </span>
          ) : null}
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight">{result.title}</h3>

        {result.contributors.length ? (
          <p className="mt-2 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <UserRound className="size-4 shrink-0" />
            <span>
              {result.contributors.map((person) => person.name).join(", ")}
              {result.mentors.length ? <span className="text-muted-foreground/70"> · mentored by {result.mentors.join(", ")}</span> : null}
            </span>
          </p>
        ) : null}

        {result.abstract ? <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-muted-foreground">{result.abstract}</p> : null}
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        {result.proposalSlug ? (
          <Button asChild>
            <Link href={`/proposals/${result.proposalSlug}`}>Read the proposal</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="outline">
              <Link href={claimHref}>This is mine — share it</Link>
            </Button>
            <p className="text-right text-xs text-muted-foreground">No proposal shared yet</p>
          </>
        )}
      </div>
    </article>
  );
}
