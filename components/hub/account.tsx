"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconArrowUpRight, IconBrandGithub, IconBrandMedium, IconBrandX, IconExternalLink, IconFileText, IconPlus, IconWorld } from "@tabler/icons-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { callApi, formatBytes, formatDate, putPdf } from "@/lib/hub/client";
import { POST_KINDS, type MyParticipation, type MyPost, type MyProposal, type PostKind, type Profile, type Story } from "@/lib/hub/types";
import { Check, Notice, PdfButton, Picker, Switch, TextArea, TextField } from "./controls";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

export function AccountWorkspace({ profile, image, isAdmin, participations }: {
  profile: Profile; image: string | null; isAdmin: boolean; participations: MyParticipation[];
}) {
  const contributorClaims = participations.filter((claim) => claim.role === "contributor" && claim.verification !== "rejected").length;
  return (
    <main>
      <header className="cb-hub-head">
        <div>
          <p className="cb-eyebrow">YOUR ACCOUNT</p>
          <h1>Your GSoC record</h1>
          <p>Claim the projects you contributed to or mentored. Once we verify a contributor claim you can publish the proposal that got you selected. Progress posts go live as soon as you add them.</p>
        </div>
        <div className="cb-hub-actions">
          {isAdmin ? <Link href="/admin" className="cb-button cb-button-outline cb-button-sm">Admin</Link> : null}
          <Link href="/account/profile" className="cb-button cb-button-outline cb-button-sm">Edit profile</Link>
          <SignOutButton />
        </div>
      </header>

      <div className="cb-hub-grid">
        <div className="cb-hub-stack">
          <div className="cb-hub-head" style={{ marginBottom: 0 }}>
            <h2 className="cb-hub-subtitle">Your projects</h2>
            <Link href="/account/claim" className="cb-button cb-button-ink cb-button-sm"><IconPlus size={15} stroke={2} aria-hidden />Claim a project</Link>
          </div>
          {participations.length ? participations.map((claim) => <ClaimCard key={claim.id} claim={claim} />) : (
            <div className="cb-empty">
              <span className="cb-empty-icon" aria-hidden="true"><IconFileText size={22} stroke={1.75} /></span>
              <h2>No projects yet</h2>
              <p>Find your GSoC project in the archive and tell us which person on it you are.</p>
              <div><Link href="/account/claim" className="cb-button cb-button-ink">Claim a project</Link></div>
            </div>
          )}
        </div>
        <aside className="cb-hub-stack">
          <ProfileSummary profile={profile} image={image} />
          <div className="cb-card">
            <div className="cb-card-head"><div><h3>How it works</h3></div></div>
            <ol className="cb-hub-howto">
              <li>Claim your project: pick the year, organization, project and your name.</li>
              <li>We check the claim against Google&apos;s archive and mark it verified.</li>
              <li>Contributors then upload the accepted proposal, remove personal details and publish it under CC BY 4.0.</li>
            </ol>
            <p className="cb-hub-hint" style={{ marginTop: 12 }}>GSoC accepts a contributor at most twice ({contributorClaims}/2 used), and nobody can mentor and contribute in the same year.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ProfileSummary({ profile, image }: { profile: Profile; image: string | null }) {
  const links = [
    profile.website_url ? { href: profile.website_url, label: "Website", icon: <IconWorld size={14} stroke={1.9} aria-hidden /> } : null,
    profile.github_username ? { href: `https://github.com/${profile.github_username}`, label: profile.github_username, icon: <IconBrandGithub size={14} stroke={1.9} aria-hidden /> } : null,
    profile.x_username ? { href: `https://x.com/${profile.x_username}`, label: `@${profile.x_username}`, icon: <IconBrandX size={14} stroke={1.9} aria-hidden /> } : null,
    profile.medium_url ? { href: profile.medium_url, label: "Medium", icon: <IconBrandMedium size={14} stroke={1.9} aria-hidden /> } : null,
  ].filter((link): link is { href: string; label: string; icon: React.ReactElement } => Boolean(link));
  return (
    <div className="cb-card">
      <div className="cb-hub-person">
        <span className="cb-hub-avatar">
          {/* eslint-disable-next-line @next/next/no-img-element -- the signed-in user's own Google photo */}
          {image ? <img src={image} alt="" referrerPolicy="no-referrer" /> : profile.display_name.slice(0, 1).toUpperCase()}
        </span>
        <div className="cb-truncate">
          <h2 className="cb-truncate">{profile.display_name}</h2>
          <p>{profile.handle ? `@${profile.handle}` : "No handle yet"} · {profile.is_public ? "Public profile" : "Private profile"}</p>
        </div>
      </div>
      {links.length ? (
        <div className="cb-hub-links">
          {links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="cb-pill">{link.icon}{link.label}</a>)}
        </div>
      ) : <p className="cb-hub-hint" style={{ marginTop: 12 }}>Add your website, GitHub, X or Medium so readers can find your work.</p>}
      {profile.is_public && profile.handle ? <Link href={`/contributors/${profile.handle}`} className="cb-inline-link cb-hub-row" style={{ fontSize: 13.5 }}>View public profile <IconArrowUpRight size={14} stroke={2} aria-hidden /></Link> : null}
    </div>
  );
}

function StatusPill({ claim }: { claim: MyParticipation }) {
  if (claim.verification === "verified") return <span className="cb-pill" data-tone="ok"><span className="cb-dot" />Verified</span>;
  if (claim.verification === "rejected") return <span className="cb-pill" data-tone="down"><span className="cb-dot" />Not accepted</span>;
  return <span className="cb-pill" data-tone="warn"><span className="cb-dot" />Not verified yet</span>;
}

function ClaimCard({ claim }: { claim: MyParticipation }) {
  const contributor = claim.role === "contributor";
  return (
    <article className="cb-card cb-hub-claim">
      <div className="cb-hub-claim-head">
        <div className="cb-truncate" style={{ whiteSpace: "normal" }}>
          <div className="cb-hub-meta">
            <span className="cb-badge" data-tone="accent">{contributor ? "Contributor" : "Mentor"}</span>
            <span className="cb-badge">{claim.year}</span>
            <Link className="cb-inline-link" href={`/organizations/${claim.organization_slug}`} style={{ fontSize: 13.5 }}>{claim.organization_name}</Link>
          </div>
          <h3>{claim.project_title}</h3>
          <p>Listed in Google&apos;s archive as {claim.archived_name}</p>
        </div>
        <StatusPill claim={claim} />
      </div>

      {claim.verification === "rejected" ? (
        <div className="cb-hub-section"><Notice tone="error">We could not verify this claim: {claim.rejection_reason}. <Link className="cb-inline-link" href="/contact">Contact us</Link> if this is wrong.</Notice></div>
      ) : null}
      {claim.verification === "unverified" ? <EvidenceSection claim={claim} /> : null}
      {contributor && claim.verification === "verified" ? <ProposalSection claim={claim} proposal={claim.proposal} /> : null}
      {contributor && claim.verification !== "rejected" ? <PostsSection claim={claim} /> : null}
      {contributor && claim.verification !== "rejected" ? <StorySection claim={claim} /> : null}
    </article>
  );
}

/* ───────────────────────────── evidence ───────────────────────────── */

function EvidenceSection({ claim }: { claim: MyParticipation }) {
  const router = useRouter();
  const [note, setNote] = useState(claim.note ?? "");
  const [links, setLinks] = useState<string[]>([...claim.evidence_urls, "", "", ""].slice(0, 3));
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  async function save() {
    setBusy("save");
    const result = await callApi(`/api/v2/me/claims/${claim.id}`, { method: "PATCH", body: { note, evidenceUrls: links.map((link) => link.trim()).filter(Boolean), story: claim.story, storyPublic: claim.story_public } });
    setBusy(null);
    setMessage(result.ok ? { tone: "ok", text: "Saved. We will review it soon." } : { tone: "error", text: result.message });
    if (result.ok) router.refresh();
  }

  async function cancel() {
    setBusy("cancel");
    const result = await callApi(`/api/v2/me/claims/${claim.id}`, { method: "DELETE" });
    setBusy(null);
    if (result.ok) router.refresh();
    else setMessage({ tone: "error", text: result.message });
  }

  return (
    <section className="cb-hub-section">
      <h4>Help us verify this claim</h4>
      <p>Links that show this is you make review faster: your final report, a merged pull request, or the organization&apos;s page that lists you.</p>
      <div className="cb-hub-steps" style={{ marginTop: 12 }}>
        <TextArea label="Note for the reviewer (private)" value={note} onChange={setNote} max={1000} rows={3} placeholder="Anything that helps us match you to the archive" />
        {links.map((link, index) => (
          <TextField key={index} label={`Evidence link ${index + 1}`} type="url" inputMode="url" value={link} max={2048} counter={false} placeholder="https://"
            onChange={(value) => setLinks((current) => current.map((item, at) => (at === index ? value : item)))} />
        ))}
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
        <div className="cb-cm-form-foot">
          {confirmCancel ? (
            <span className="cb-hub-actions">
              <button type="button" className="cb-button cb-button-outline cb-button-sm" onClick={() => setConfirmCancel(false)}>Keep claim</button>
              <button type="button" className="cb-button cb-button-ink cb-button-sm" disabled={busy !== null} onClick={cancel}>{busy === "cancel" ? "Cancelling…" : "Yes, cancel claim"}</button>
            </span>
          ) : <button type="button" className="cb-hub-text-button" data-tone="down" onClick={() => setConfirmCancel(true)}>Cancel this claim</button>}
          <button type="button" className="cb-button cb-button-ink cb-button-sm" disabled={busy !== null} onClick={save}>{busy === "save" ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── proposal ───────────────────────────── */

function ProposalSection({ claim, proposal }: { claim: MyParticipation; proposal: MyProposal | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redacted, setRedacted] = useState(false);
  const [acceptLicence, setAcceptLicence] = useState(false);
  const [ownWork, setOwnWork] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removalOpen, setRemovalOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function run(action: string, task: () => Promise<{ ok: boolean; message?: string }>) {
    setBusy(action);
    setError(null);
    const result = await task();
    setBusy(null);
    if (!result.ok) setError(result.message ?? "Something went wrong. Try again.");
    else router.refresh();
    return result.ok;
  }

  async function upload(file: File) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { setError("Choose a PDF file"); return; }
    if (file.size > MAX_PDF_BYTES) { setError("The PDF must be 10 MB or smaller"); return; }
    await run("upload", async () => {
      const start = await callApi<{ proposalId: string; key: string; uploadUrl: string }>("/api/v2/me/proposals", { body: { personId: claim.person_id } });
      if (!start.ok) return start;
      if (!(await putPdf(start.data.uploadUrl, file))) return { ok: false, message: "The upload did not finish. Try again in a few minutes." };
      return callApi(`/api/v2/me/proposals/${start.data.proposalId}/complete`, { body: { key: start.data.key } });
    });
  }

  const base = proposal ? `/api/v2/me/proposals/${proposal.id}` : "";
  const errorNotice = error ? <Notice tone="error">{error}</Notice> : null;

  if (!proposal || (!proposal.file_sha256 && proposal.status === "draft")) {
    return (
      <section className="cb-hub-section">
        <h4>Your accepted proposal</h4>
        <p>Share the proposal that got you selected so future applicants can learn from it. Remove your phone number, email, address and student ID first. Nothing is public until you publish.</p>
        <div className="cb-hub-row"><PdfButton label="Upload PDF" busy={busy === "upload"} onFile={upload} /><span className="cb-hub-hint">PDF, up to 10 MB</span></div>
        {proposal?.upload_in_progress ? <Notice>An upload is still being processed. Wait a few minutes before trying again.</Notice> : null}
        {errorNotice}
      </section>
    );
  }

  if (proposal.status === "removed") {
    return (
      <section className="cb-hub-section">
        <h4>Your accepted proposal</h4>
        <Notice tone="warn">Removed on {formatDate(proposal.removed_at)}: {proposal.removed_reason}. <Link className="cb-inline-link" href="/contact">Contact us</Link> if you want it back.</Notice>
      </section>
    );
  }

  const facts = (
    <div className="cb-hub-facts">
      <span>Version {proposal.file_version}</span>
      {proposal.file_pages ? <span>{proposal.file_pages} pages</span> : null}
      {proposal.file_bytes ? <span>{formatBytes(proposal.file_bytes)}</span> : null}
      {proposal.file_uploaded_at ? <span>Uploaded {formatDate(proposal.file_uploaded_at)}{proposal.uploaded_by_admin ? " by the site admin" : ""}</span> : null}
    </div>
  );
  const preview = <a className="cb-button cb-button-outline cb-button-sm" href={`${base}/pdf`} target="_blank" rel="noreferrer"><IconExternalLink size={14} stroke={1.9} aria-hidden />Open PDF</a>;

  if (proposal.locked_at) {
    return (
      <section className="cb-hub-section">
        <h4>Your accepted proposal <span className="cb-pill" data-tone="ok"><span className="cb-dot" />Published</span></h4>
        <p>Published on {formatDate(proposal.published_at)} under CC BY 4.0. It is final, so only the site admin can replace or remove it.</p>
        <div className="cb-hub-row">{facts}</div>
        <div className="cb-hub-row">
          <Link className="cb-button cb-button-ink cb-button-sm" href={`/proposals/${proposal.slug}`}>View public page</Link>
          {preview}
        </div>
        {proposal.removal_requested_at ? <Notice>You asked us to remove it on {formatDate(proposal.removal_requested_at)}. We will act on it soon.</Notice> : removalOpen ? (
          <div className="cb-hub-inline-form">
            <TextArea label="Why should we remove it?" value={reason} onChange={setReason} max={1000} rows={3} placeholder="For example: it still contains my phone number" />
            <div className="cb-hub-actions" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="cb-button cb-button-outline cb-button-sm" onClick={() => setRemovalOpen(false)}>Cancel</button>
              <button type="button" className="cb-button cb-button-ink cb-button-sm" disabled={busy !== null || reason.trim().length < 3}
                onClick={() => run("removal", () => callApi(`${base}/removal`, { body: { reason } }))}>{busy === "removal" ? "Sending…" : "Ask for removal"}</button>
            </div>
          </div>
        ) : <button type="button" className="cb-hub-text-button cb-hub-row" onClick={() => setRemovalOpen(true)}>Ask us to remove it</button>}
        {errorNotice}
      </section>
    );
  }

  const confirmationDone = !proposal.needs_confirmation || proposal.pii_confirmed;
  return (
    <section className="cb-hub-section">
      <h4>Your accepted proposal {proposal.status === "published" ? <span className="cb-pill" data-tone="ok"><span className="cb-dot" />Published by the site</span> : <span className="cb-pill"><span className="cb-dot" />Draft</span>}</h4>
      {proposal.status === "published" ? <p>The site admin published this copy with your permission. You can replace it, delete it, or publish it as your own final version.</p> : <p>Check the file below, then publish it. Drafts are private.</p>}
      <div className="cb-hub-row">{facts}</div>
      <div className="cb-hub-row">
        {preview}
        <PdfButton label="Replace PDF" variant="outline" busy={busy === "upload"} onFile={upload} />
        {confirmDelete ? (
          <>
            <button type="button" className="cb-button cb-button-outline cb-button-sm" onClick={() => setConfirmDelete(false)}>Keep it</button>
            <button type="button" className="cb-button cb-button-ink cb-button-sm" disabled={busy !== null}
              onClick={() => run("delete", () => callApi(base, { method: "DELETE" }))}>{busy === "delete" ? "Deleting…" : "Yes, delete it"}</button>
          </>
        ) : <button type="button" className="cb-hub-text-button" data-tone="down" onClick={() => setConfirmDelete(true)}>Delete</button>}
      </div>

      <hr className="cb-hub-divider" />
      <div className="cb-hub-steps">
        <strong style={{ fontSize: 14 }}>1. Personal details</strong>
        {proposal.extraction_status === "failed" ? (
          <Notice tone="warn">We could not read the text of this PDF (it may be a scan), so check it yourself for your phone number, email, address and student ID.</Notice>
        ) : proposal.pii_findings?.length ? (
          <Notice tone="warn">
            We found contact details in this file. Remove them, upload the new PDF, or confirm they are fine to publish.
            <span className="cb-hub-findings">{proposal.pii_findings.map((finding, index) => <span key={index}>{finding.kind === "email" ? "Email" : "Phone"} {finding.sample} · page {finding.page}</span>)}</span>
          </Notice>
        ) : <Notice tone="ok">No email addresses or phone numbers found. Also check for your address and student ID.</Notice>}
        {proposal.needs_confirmation ? (proposal.pii_confirmed ? <Notice tone="ok">You confirmed this file has no personal details you do not want public.</Notice> : (
          <div className="cb-hub-actions" style={{ justifyContent: "space-between" }}>
            <Check checked={redacted} onChange={setRedacted}>I checked this exact file and it has no personal details I do not want public.</Check>
            <button type="button" className="cb-button cb-button-outline cb-button-sm" disabled={!redacted || busy !== null}
              onClick={() => run("confirm", () => callApi(`${base}/confirm`, { body: { sha256: proposal.file_sha256 } }))}>{busy === "confirm" ? "Saving…" : "Confirm"}</button>
          </div>
        )) : null}

        <strong style={{ fontSize: 14, marginTop: 6 }}>2. Publish</strong>
        <Check checked={ownWork} onChange={setOwnWork} disabled={!confirmationDone}>This is the proposal I wrote that was accepted for this project.</Check>
        <Check checked={acceptLicence} onChange={setAcceptLicence} disabled={!confirmationDone}>
          I publish it under <a className="cb-inline-link" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> and accept the <Link className="cb-inline-link" href="/terms-and-conditions">terms</Link>. Publishing is final; afterwards only the site admin can replace or remove it, and you can ask for removal at any time.
        </Check>
        <div className="cb-cm-form-foot">
          <p>{confirmationDone ? "Readers will see it on the project page and in the proposal archive." : "Confirm step 1 first."}</p>
          <button type="button" className="cb-button cb-button-ink cb-button-sm" disabled={!confirmationDone || !ownWork || !acceptLicence || busy !== null}
            onClick={() => run("finalize", () => callApi(`${base}/finalize`, { body: { acceptLicence: true, confirmOwnWork: true } }))}>{busy === "finalize" ? "Publishing…" : "Publish proposal"}</button>
        </div>
      </div>
      {errorNotice}
    </section>
  );
}

/* ───────────────────────────── posts ───────────────────────────── */

type PostDraft = { url: string; title: string; kind: PostKind; publishedOn: string };
const emptyPost: PostDraft = { url: "", title: "", kind: "weekly_update", publishedOn: "" };
const kindLabel = (kind: PostKind) => POST_KINDS.find((item) => item.value === kind)?.label ?? kind;

function PostsSection({ claim }: { claim: MyParticipation }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<PostDraft>(emptyPost);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function open(post?: MyPost) {
    setError(null);
    setFields({});
    setEditing(post?.id ?? "new");
    setDraft(post ? { url: post.url, title: post.title ?? "", kind: post.kind, publishedOn: post.published_on ?? "" } : emptyPost);
  }

  async function save() {
    setBusy("save");
    const body = { url: draft.url.trim(), title: draft.title.trim() || null, kind: draft.kind, publishedOn: draft.publishedOn.trim() || null };
    const result = editing === "new"
      ? await callApi("/api/v2/me/posts", { body: { ...body, personId: claim.person_id } })
      : await callApi(`/api/v2/me/posts/${editing}`, { method: "PATCH", body });
    setBusy(null);
    if (!result.ok) { setError(result.message); setFields(result.fields ?? {}); return; }
    setEditing(null);
    router.refresh();
  }

  async function remove(id: string) {
    setBusy(id);
    const result = await callApi(`/api/v2/me/posts/${id}`, { method: "DELETE" });
    setBusy(null);
    setConfirmDelete(null);
    if (result.ok) router.refresh();
    else setError(result.message);
  }

  const form = (
    <div className="cb-hub-inline-form">
      <TextField label="Link to the post" type="url" inputMode="url" value={draft.url} max={2048} counter={false} placeholder="https://" error={fields.url}
        onChange={(url) => setDraft((current) => ({ ...current, url }))} />
      <TextField label="Title (optional)" value={draft.title} max={140} error={fields.title} placeholder="Week 3: parser rewrite" onChange={(title) => setDraft((current) => ({ ...current, title }))} />
      <div className="cb-cm-form-row">
        <Picker label="Type" placeholder="Choose a type" value={draft.kind} options={POST_KINDS.map((kind) => ({ value: kind.value, label: kind.label }))}
          onChange={(kind) => setDraft((current) => ({ ...current, kind: kind as PostKind }))} />
        <TextField label="Published on (optional)" value={draft.publishedOn} max={10} counter={false} placeholder="YYYY-MM-DD" inputMode="numeric" error={fields.publishedOn}
          onChange={(publishedOn) => setDraft((current) => ({ ...current, publishedOn }))} />
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="cb-hub-actions" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="cb-button cb-button-outline cb-button-sm" onClick={() => setEditing(null)}>Cancel</button>
        <button type="button" className="cb-button cb-button-ink cb-button-sm" disabled={busy !== null || !draft.url.trim()} onClick={save}>{busy === "save" ? "Saving…" : editing === "new" ? "Add post" : "Save"}</button>
      </div>
    </div>
  );

  return (
    <section className="cb-hub-section">
      <h4>Progress posts</h4>
      <p>Link the weekly updates, reports and talks you published during GSoC. They appear on the project page right away{claim.verification === "verified" ? "" : ", marked “Not verified” until we verify your claim"}. We only store the link.</p>
      {claim.posts.length ? (
        <ul className="cb-hub-list" style={{ marginTop: 12 }}>
          {claim.posts.map((post) => (
            <li key={post.id}>
              {editing === post.id ? <div style={{ width: "100%" }}>{form}</div> : (
                <>
                  <div className="cb-hub-list-main">
                    <a className="cb-inline-link" href={post.url} target="_blank" rel="noreferrer">{post.title || post.url}</a>
                    <small>{kindLabel(post.kind)}{post.published_on ? ` · ${formatDate(post.published_on)}` : ""}{post.hidden ? ` · Hidden by a moderator: ${post.hidden_reason ?? ""}` : ""}</small>
                  </div>
                  {post.hidden ? <span className="cb-pill" data-tone="down"><span className="cb-dot" />Hidden</span> : confirmDelete === post.id ? (
                    <span className="cb-hub-actions">
                      <button type="button" className="cb-hub-text-button" onClick={() => setConfirmDelete(null)}>Keep</button>
                      <button type="button" className="cb-button cb-button-ink cb-button-sm" disabled={busy !== null} onClick={() => remove(post.id)}>{busy === post.id ? "Deleting…" : "Delete"}</button>
                    </span>
                  ) : (
                    <span className="cb-hub-actions">
                      <button type="button" className="cb-hub-text-button" onClick={() => open(post)}>Edit</button>
                      <button type="button" className="cb-hub-text-button" data-tone="down" onClick={() => setConfirmDelete(post.id)}>Delete</button>
                    </span>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {editing === "new" ? form : <button type="button" className="cb-button cb-button-outline cb-button-sm cb-hub-row" onClick={() => open()}><IconPlus size={14} stroke={2} aria-hidden />Add a post</button>}
    </section>
  );
}

/* ───────────────────────────── story ───────────────────────────── */

function StorySection({ claim }: { claim: MyParticipation }) {
  const router = useRouter();
  const story = claim.story ?? { v: 1 as const };
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    chose_org_because: story.chose_org_because ?? "",
    prior_contributions: story.prior_contributions?.toString() ?? "",
    first_contribution_month: story.first_contribution_month ?? "",
    hours_per_week: story.hours_per_week?.toString() ?? "",
    proposal_tip: story.proposal_tip ?? "",
    advice: story.advice ?? "",
  });
  const [isPublic, setIsPublic] = useState(claim.story_public);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const set = (key: keyof typeof values) => (value: string) => setValues((current) => ({ ...current, [key]: value }));
  const toNumber = (value: string) => (value.trim() === "" ? null : Number(value.replace(/\D/g, "")));

  async function save() {
    setBusy(true);
    const next: Story = {
      v: 1,
      chose_org_because: values.chose_org_because.trim() || undefined,
      prior_contributions: toNumber(values.prior_contributions) ?? undefined,
      first_contribution_month: values.first_contribution_month.trim() || undefined,
      hours_per_week: toNumber(values.hours_per_week) ?? undefined,
      proposal_tip: values.proposal_tip.trim() || undefined,
      advice: values.advice.trim() || undefined,
    };
    const result = await callApi(`/api/v2/me/claims/${claim.id}`, { method: "PATCH", body: { note: claim.note, evidenceUrls: claim.evidence_urls, story: next, storyPublic: isPublic } });
    setBusy(false);
    setFields(result.ok ? {} : result.fields ?? {});
    setMessage(result.ok ? { tone: "ok", text: "Saved" } : { tone: "error", text: result.message });
    if (result.ok) router.refresh();
  }

  if (!open) {
    return (
      <section className="cb-hub-section">
        <h4>Your GSoC story</h4>
        <p>A few answers about how you got selected help applicants more than anything else. Optional, and private unless you choose to show it.</p>
        <button type="button" className="cb-button cb-button-outline cb-button-sm cb-hub-row" onClick={() => setOpen(true)}>{claim.story ? "Edit your answers" : "Answer six questions"}</button>
      </section>
    );
  }

  return (
    <section className="cb-hub-section">
      <h4>Your GSoC story</h4>
      <div className="cb-hub-steps" style={{ marginTop: 12 }}>
        <TextArea label="Why did you choose this organization?" value={values.chose_org_because} onChange={set("chose_org_because")} max={600} rows={3} error={fields["story.chose_org_because"]} />
        <div className="cb-cm-form-row">
          <TextField label="Contributions before applying" value={values.prior_contributions} onChange={set("prior_contributions")} max={4} counter={false} inputMode="numeric" placeholder="For example 6" error={fields["story.prior_contributions"]} />
          <TextField label="First contribution (month)" value={values.first_contribution_month} onChange={set("first_contribution_month")} max={7} counter={false} placeholder="YYYY-MM" error={fields["story.first_contribution_month"]} />
        </div>
        <TextField label="Hours per week during GSoC" value={values.hours_per_week} onChange={set("hours_per_week")} max={2} counter={false} inputMode="numeric" placeholder="For example 20" error={fields["story.hours_per_week"]} />
        <TextArea label="What made your proposal work?" value={values.proposal_tip} onChange={set("proposal_tip")} max={600} rows={3} error={fields["story.proposal_tip"]} />
        <TextArea label="Advice for next year's applicants" value={values.advice} onChange={set("advice")} max={1000} rows={4} error={fields["story.advice"]} />
        <Switch checked={isPublic} onChange={setIsPublic} label="Show these answers publicly" hint="On the project page and your public profile" />
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
        <div className="cb-hub-actions" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="cb-button cb-button-outline cb-button-sm" onClick={() => setOpen(false)}>Close</button>
          <button type="button" className="cb-button cb-button-ink cb-button-sm" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save answers"}</button>
        </div>
      </div>
    </section>
  );
}
