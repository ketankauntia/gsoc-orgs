import Link from "next/link";
import { IconArrowUpRight, IconFileText, IconNotes, IconUserCheck } from "@tabler/icons-react";
import type { ContributorWork, HubPost, HubProposal } from "@/lib/hub/public";
import { SectionHead } from "./page";
import { fmt, plural } from "./ui";
import "./contributor-work.css";

// Proposals and progress posts shared by past contributors, shown on project,
// organization and yearly pages.

const KIND: Record<string, string> = { weekly_update: "Weekly update", midterm: "Midterm report", final_report: "Final report", talk_video: "Talk", other: "Post" };

function shortDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function ProposalItem({ proposal, withProject }: { proposal: HubProposal; withProject: boolean }) {
  return (
    <li>
      <span className="cb-cw-icon" aria-hidden="true"><IconFileText size={16} stroke={1.75} /></span>
      <div className="cb-cw-main">
        <Link href={`/proposals/${proposal.slug}`}>{withProject ? proposal.project_title : "Accepted proposal"}</Link>
        <span className="cb-cw-meta">
          {withProject ? <span>GSoC {proposal.year} · {proposal.organization_name}</span> : null}
          <span>By {proposal.author}</span>
          {proposal.pages ? <span>{plural(proposal.pages, "page")}</span> : null}
          <span>{proposal.author_published ? "Published by the author" : "Published with permission"}</span>
        </span>
      </div>
    </li>
  );
}

function PostItem({ post, withProject }: { post: HubPost; withProject: boolean }) {
  return (
    <li>
      <span className="cb-cw-icon" aria-hidden="true"><IconNotes size={16} stroke={1.75} /></span>
      <div className="cb-cw-main">
        <a href={post.url} target="_blank" rel="noopener noreferrer">{post.title || host(post.url)} <IconArrowUpRight size={12} stroke={2} aria-hidden /></a>
        <span className="cb-cw-meta">
          <span>{KIND[post.kind] ?? "Post"}</span>
          {shortDate(post.published_on) ? <span>{shortDate(post.published_on)}</span> : null}
          <span>By {post.author}</span>
          {withProject ? <span>{post.project_title}</span> : null}
          {post.verified ? null : <span className="cb-badge">Not verified</span>}
        </span>
      </div>
    </li>
  );
}

/** The card on a project page: its proposal, the contributor's posts and who is verified. */
export function ProjectContributorWork({ work, externalId }: { work: ContributorWork; externalId: string }) {
  const claimHref = `/share-proposal?project=${encodeURIComponent(externalId)}`;
  const empty = !work.proposals.length && !work.posts.length;
  return (
    <article className="cb-card cb-cw">
      <header className="cb-card-head">
        <div>
          <h2>From the people who did it</h2>
          <p>{empty ? "No proposal or progress posts shared yet" : "Shared by the contributor, linked to this archived project"}</p>
        </div>
      </header>
      {work.proposals.length ? <ul className="cb-cw-list">{work.proposals.map((proposal) => <ProposalItem key={proposal.slug} proposal={proposal} withProject={false} />)}</ul> : null}
      {work.posts.length ? (
        <>
          <p className="cb-cw-label">Progress posts</p>
          <ul className="cb-cw-list">{work.posts.map((post) => <PostItem key={post.id} post={post} withProject={false} />)}</ul>
        </>
      ) : null}
      {work.people.length ? (
        <p className="cb-cw-people">
          <IconUserCheck size={15} stroke={1.75} aria-hidden />
          <span>Verified here: {work.people.map((person, index) => (
            <span key={`${person.role}-${person.archived_name}`}>
              {index ? ", " : ""}
              {person.handle ? <Link className="cb-inline-link" href={`/contributors/${person.handle}`}>{person.display_name ?? person.archived_name}</Link> : person.archived_name}
              {` (${person.role})`}
            </span>
          ))}</span>
        </p>
      ) : null}
      <div className="cb-cw-foot">
        <p>{empty ? "Worked on this project? Share the proposal that got you selected and the posts you wrote." : "Contributor or mentor on this project?"}</p>
        <Link href={claimHref} className="cb-button cb-button-outline cb-button-sm">Claim this project</Link>
      </div>
    </article>
  );
}

/** A section on organization and yearly pages: latest proposals and posts. */
export function ContributorWorkSection({ id, eyebrow, title, work, proposalsHref, postsHref, emptyText }: {
  id: string;
  eyebrow: string;
  title: string;
  work: ContributorWork;
  proposalsHref: string;
  postsHref: string;
  emptyText: string;
}) {
  const empty = !work.proposalCount && !work.postCount;
  const quiet = empty ? undefined : [work.proposalCount ? plural(work.proposalCount, "proposal") : null, work.postCount ? plural(work.postCount, "progress post") : null].filter(Boolean).join(" and ") + " shared.";
  return (
    <section aria-labelledby={id} className="cb-cw-section">
      <SectionHead id={id} eyebrow={eyebrow} title={title} quiet={quiet} action={work.proposalCount ? { label: `All ${fmt(work.proposalCount)} proposals`, href: proposalsHref } : undefined} />
      {empty ? (
        <div className="cb-card cb-cw-empty">
          <p>{emptyText}</p>
          <Link href="/account/claim" className="cb-button cb-button-outline cb-button-sm">Claim your project</Link>
        </div>
      ) : (
        <div className="cb-cw-grid">
          <div className="cb-card">
            <header className="cb-card-head"><div><h3>Accepted proposals</h3><p>Published by their authors or with permission</p></div></header>
            {work.proposals.length ? <ul className="cb-cw-list">{work.proposals.map((proposal) => <ProposalItem key={proposal.slug} proposal={proposal} withProject />)}</ul> : <p className="cb-card-note">None shared yet.</p>}
          </div>
          <div className="cb-card">
            <header className="cb-card-head">
              <div><h3>Progress posts</h3><p>Weekly updates, reports and talks</p></div>
              {work.postCount > work.posts.length ? <Link href={postsHref} className="cb-text-link">All {fmt(work.postCount)}</Link> : null}
            </header>
            {work.posts.length ? <ul className="cb-cw-list">{work.posts.map((post) => <PostItem key={post.id} post={post} withProject />)}</ul> : <p className="cb-card-note">None shared yet.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
