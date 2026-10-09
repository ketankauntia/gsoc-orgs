"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconExternalLink, IconSearch } from "@tabler/icons-react";
import type { AdminClaim, AdminPostRow, AdminProposalRow, AuditEntry, PersonMatch } from "@/lib/hub/admin";
import { callApi, formatDate, putPdf } from "@/lib/hub/client";
import { POST_KINDS, type PostKind } from "@/lib/hub/types";
import { Check, Notice, PdfButton, Picker, TextArea, TextField } from "./controls";

/* ───────────────────────────── shared ───────────────────────────── */

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function run(key: string, task: () => Promise<{ ok: boolean; message?: string }>) {
    setBusy(key);
    setError(null);
    const result = await task();
    setBusy(null);
    if (result.ok) router.refresh();
    else setError(result.message ?? "Something went wrong");
    return result.ok;
  }
  return { busy, error, run, setError };
}

/** Archive search by contributor name, project title or project id. */
function PersonSearch({ onPick, anyRole = false, label = "Find the contributor" }: { onPick: (person: PersonMatch) => void; anyRole?: boolean; label?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonMatch[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    let current = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      const result = await callApi<{ people: PersonMatch[] }>(`/api/v2/admin/people?q=${encodeURIComponent(q)}${anyRole ? "&role=any" : ""}`);
      if (current) { setLoading(false); setResults(result.ok ? result.data.people : []); }
    }, 250);
    return () => { current = false; clearTimeout(timer); };
  }, [query, anyRole]);
  return (
    <div className="cb-hub-steps">
      <label className="cb-cm-field cb-hub-field">
        <span>{label}</span>
        <div className="cb-hub-input"><em aria-hidden="true"><IconSearch size={14} stroke={2} /></em><input type="search" value={query} maxLength={120} placeholder="Name, project title or project id" onChange={(event) => setQuery(event.target.value)} /></div>
      </label>
      {loading ? <p className="cb-hub-hint">Searching…</p> : null}
      {results.length ? (
        <div className="cb-hub-people">
          {results.map((person) => (
            <button key={person.person_id} type="button" className="cb-hub-person-option" onClick={() => { onPick(person); setQuery(""); setResults([]); }}>
              <span>
                <strong style={{ fontWeight: 500 }}>{person.archived_name}</strong>
                <small>{person.role === "mentor" ? "Mentor · " : ""}{person.year} · {person.organization_name} · {person.project_title}{person.proposal_id ? " · has a proposal" : ""}</small>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ReasonForm({ label, action, busy, onCancel, onSubmit }: { label: string; action: string; busy: boolean; onCancel: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="cb-hub-inline-form">
      <TextArea label={label} value={reason} onChange={setReason} max={1000} rows={2} />
      <div className="cb-hub-actions" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="cb-button cb-button-outline cb-button-sm" onClick={onCancel}>Cancel</button>
        <button type="button" className="cb-button cb-button-ink cb-button-sm" disabled={busy || reason.trim().length < 3} onClick={() => onSubmit(reason)}>{busy ? "Saving…" : action}</button>
      </div>
    </div>
  );
}

/* ───────────────────────────── claims ───────────────────────────── */

export function AdminClaims({ claims, recent }: { claims: AdminClaim[]; recent: AuditEntry[] }) {
  return (
    <div className="cb-hub-grid">
      <div className="cb-hub-stack">
        {claims.length ? claims.map((claim) => <ClaimReview key={claim.id} claim={claim} />) : <div className="cb-empty"><h2>Nothing to review</h2><p>New claims appear here.</p></div>}
      </div>
      <aside className="cb-hub-stack">
        <OverrideForm />
        <div className="cb-card">
          <div className="cb-card-head"><div><h3>Recent activity</h3></div></div>
          <ul className="cb-hub-list">
            {recent.length ? recent.map((entry) => (
              <li key={entry.id}><div className="cb-hub-list-main"><span style={{ fontSize: 13.5 }}>{entry.action.replaceAll("_", " ")} · {entry.target}</span><small>{formatDate(entry.at)}{entry.reason ? ` · ${entry.reason}` : ""}</small></div></li>
            )) : <li><span className="cb-hub-hint">No activity yet</span></li>}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function ClaimReview({ claim }: { claim: AdminClaim }) {
  const { busy, error, run } = useAction();
  const [rejecting, setRejecting] = useState(false);
  const [suspending, setSuspending] = useState(false);
  return (
    <article className="cb-card cb-hub-claim">
      <div className="cb-hub-claim-head">
        <div style={{ minWidth: 0 }}>
          <div className="cb-hub-meta">
            <span className="cb-badge" data-tone="accent">{claim.role === "contributor" ? "Contributor" : "Mentor"}</span>
            <span className="cb-badge">{claim.year}</span>
            <span style={{ fontSize: 13.5 }}>{claim.organization_name}</span>
          </div>
          <h3>{claim.project_title}</h3>
          <p>Claimed {formatDate(claim.created_at)}{claim.other_claims_on_person ? ` · ${claim.other_claims_on_person} other open claim(s) on this person` : ""}</p>
        </div>
        <span className="cb-pill" data-tone="warn"><span className="cb-dot" />Not verified</span>
      </div>
      <div className="cb-hub-section">
        <dl className="cb-hub-compare">
          <div><dt>Google account</dt><dd>{claim.google_name || "—"}<br /><small className="cb-hub-hint">{claim.email ?? "email unavailable"}</small></dd></div>
          <div><dt>Name in the archive</dt><dd>{claim.archived_name}{claim.archived_profile_url ? <> · <a className="cb-inline-link" href={claim.archived_profile_url} target="_blank" rel="noreferrer">archive profile</a></> : null}</dd></div>
          <div><dt>Site profile</dt><dd>{claim.display_name}{claim.github_username ? <> · <a className="cb-inline-link" href={`https://github.com/${claim.github_username}`} target="_blank" rel="noreferrer">github.com/{claim.github_username}</a></> : null}</dd></div>
          <div><dt>Final work product</dt><dd>{claim.work_product_url ? <a className="cb-inline-link" href={claim.work_product_url} target="_blank" rel="noreferrer">{claim.work_product_url}</a> : "Not in the archive"}</dd></div>
          {claim.note ? <div style={{ gridColumn: "1 / -1" }}><dt>Note</dt><dd>{claim.note}</dd></div> : null}
          {claim.evidence_urls.length ? <div style={{ gridColumn: "1 / -1" }}><dt>Evidence</dt><dd>{claim.evidence_urls.map((url) => <a key={url} className="cb-inline-link" style={{ display: "block" }} href={url} target="_blank" rel="noreferrer">{url}</a>)}</dd></div> : null}
        </dl>
        {rejecting ? <ReasonForm label="Why is this claim rejected? The claimant sees this." action="Reject claim" busy={busy === "reject"} onCancel={() => setRejecting(false)}
          onSubmit={(reason) => run("reject", () => callApi(`/api/v2/admin/claims/${claim.id}`, { body: { action: "reject", reason } }))} /> : null}
        {suspending ? <ReasonForm label="Why is this account suspended? Its content leaves public view." action="Suspend account" busy={busy === "suspend"} onCancel={() => setSuspending(false)}
          onSubmit={(reason) => run("suspend", () => callApi(`/api/v2/admin/profiles/${claim.user_id}`, { body: { status: "suspended", reason } }))} /> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        {!rejecting && !suspending ? (
          <div className="cb-cm-form-foot" style={{ marginTop: 14 }}>
            <button type="button" className="cb-hub-text-button" data-tone="down" onClick={() => setSuspending(true)}>Suspend account</button>
            <span className="cb-hub-actions">
              <button type="button" className="cb-button cb-button-outline cb-button-sm" onClick={() => setRejecting(true)}>Reject</button>
              <button type="button" className="cb-button cb-button-ink cb-button-sm" disabled={busy !== null}
                onClick={() => run("verify", () => callApi(`/api/v2/admin/claims/${claim.id}`, { body: { action: "verify" } }))}>{busy === "verify" ? "Verifying…" : "Verify"}</button>
            </span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function OverrideForm() {
  const { busy, error, run } = useAction();
  const [open, setOpen] = useState(false);
  const [person, setPerson] = useState<PersonMatch | null>(null);
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  return (
    <div className="cb-card">
      <div className="cb-card-head"><div><h3>Record a claim</h3><p>For archive exceptions the claim rules refuse. The account must have signed in once.</p></div></div>
      {!open ? <button type="button" className="cb-button cb-button-outline cb-button-sm" onClick={() => setOpen(true)}>Record a claim</button> : (
        <div className="cb-hub-steps">
          {person ? <Notice>{person.archived_name} · {person.role} · {person.year} · {person.project_title} <button type="button" className="cb-hub-text-button" onClick={() => setPerson(null)}>Change</button></Notice>
            : <PersonSearch anyRole label="Archive person" onPick={setPerson} />}
          <TextField label="Account email" type="email" inputMode="email" value={email} onChange={setEmail} max={200} counter={false} />
          <TextArea label="Reason" value={reason} onChange={setReason} max={1000} rows={2} />
          {error ? <Notice tone="error">{error}</Notice> : null}
          <div className="cb-hub-actions" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="cb-button cb-button-outline cb-button-sm" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="cb-button cb-button-ink cb-button-sm" disabled={!person || !email || reason.trim().length < 3 || busy !== null}
              onClick={async () => { if (await run("override", () => callApi("/api/v2/admin/claims", { body: { email, personId: person!.person_id, reason } }))) { setOpen(false); setPerson(null); setEmail(""); setReason(""); } }}>
              {busy ? "Saving…" : "Record verified claim"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── proposals ───────────────────────────── */

async function adminUpload(personId: string, file: File) {
  if (file.size > 10 * 1024 * 1024) return { ok: false as const, message: "The PDF must be 10 MB or smaller" };
  const start = await callApi<{ proposalId: string; key: string; uploadUrl: string }>("/api/v2/admin/proposals", { body: { personId } });
  if (!start.ok) return start;
  if (!(await putPdf(start.data.uploadUrl, file))) return { ok: false as const, message: "The upload did not finish" };
  return callApi(`/api/v2/admin/proposals/${start.data.proposalId}/complete`, { body: { key: start.data.key } });
}

export function AdminProposals({ proposals }: { proposals: AdminProposalRow[] }) {
  const { busy, error, run } = useAction();
  const [person, setPerson] = useState<PersonMatch | null>(null);
  return (
    <div className="cb-hub-grid">
      <div className="cb-hub-stack">
        {proposals.length ? proposals.map((proposal) => <ProposalReview key={proposal.id} proposal={proposal} />) : <div className="cb-empty"><h2>No proposals yet</h2><p>Uploaded and published proposals appear here.</p></div>}
      </div>
      <aside className="cb-hub-stack">
        <div className="cb-card">
          <div className="cb-card-head"><div><h3>Add a proposal</h3><p>Upload a proposal you have the author&apos;s permission to publish. Record the permission before publishing.</p></div></div>
          {person ? (
            <div className="cb-hub-steps">
              <Notice>{person.archived_name} · {person.year} · {person.project_title} <button type="button" className="cb-hub-text-button" onClick={() => setPerson(null)}>Change</button></Notice>
              <PdfButton label={person.proposal_id ? "Replace its PDF" : "Upload PDF"} busy={busy === "upload"} onFile={(file) => run("upload", () => adminUpload(person.person_id, file)).then((ok) => { if (ok) setPerson(null); })} />
              {error ? <Notice tone="error">{error}</Notice> : null}
            </div>
          ) : <PersonSearch onPick={setPerson} />}
        </div>
      </aside>
    </div>
  );
}

function ProposalReview({ proposal }: { proposal: AdminProposalRow }) {
  const { busy, error, run } = useAction();
  const [panel, setPanel] = useState<"permission" | "remove" | null>(null);
  const [checked, setChecked] = useState(false);
  const base = `/api/v2/admin/proposals/${proposal.id}`;
  const tone = proposal.status === "published" ? "ok" : proposal.status === "removed" ? "down" : undefined;
  return (
    <article className="cb-card cb-hub-claim">
      <div className="cb-hub-claim-head">
        <div style={{ minWidth: 0 }}>
          <div className="cb-hub-meta">
            <span className="cb-badge">{proposal.year}</span>
            <span style={{ fontSize: 13.5 }}>{proposal.organization_name}</span>
            {proposal.locked ? <span className="cb-badge">Final</span> : null}
          </div>
          <h3>{proposal.project_title}</h3>
          <p>{proposal.archived_name}{proposal.verified_owner ? ` · verified owner: ${proposal.verified_owner}` : " · no verified owner"}</p>
        </div>
        <span className="cb-pill" data-tone={tone}><span className="cb-dot" />{proposal.status}</span>
      </div>
      <div className="cb-hub-section">
        <div className="cb-hub-facts">
          {proposal.file_sha256 ? <span>Version {proposal.file_version}{proposal.file_pages ? ` · ${proposal.file_pages} pages` : ""}</span> : <span>No file</span>}
          <span>{proposal.owner_consented ? "Author consented (CC BY 4.0)" : proposal.permission_basis ? `Permission: ${proposal.permission_basis.replaceAll("_", " ")} (${formatDate(proposal.permission_given_at)})` : "No consent or permission recorded"}</span>
          {proposal.extraction_status === "failed" ? <span>Text unreadable</span> : null}
        </div>
        {proposal.removal_requested_at && proposal.status === "published" ? <Notice tone="warn">The author asked for removal on {formatDate(proposal.removal_requested_at)}.</Notice> : null}
        {proposal.needs_confirmation && !proposal.pii_confirmed && proposal.status !== "removed" ? (
          <Notice tone="warn">
            {proposal.extraction_status === "failed" ? "The text could not be read; check the file by eye." : "Contact details found:"}
            {proposal.pii_findings?.length ? <span className="cb-hub-findings">{proposal.pii_findings.map((finding, index) => <span key={index}>{finding.kind} {finding.sample} · page {finding.page}</span>)}</span> : null}
          </Notice>
        ) : null}
        {panel === "permission" ? <PermissionForm base={base} onDone={() => setPanel(null)} /> : null}
        {panel === "remove" ? <ReasonForm label="Why is it removed? The author sees this." action="Remove proposal" busy={busy === "remove"} onCancel={() => setPanel(null)}
          onSubmit={(reason) => run("remove", () => callApi(`${base}/remove`, { body: { reason } })).then(() => setPanel(null))} /> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        {panel === null ? (
          <div className="cb-hub-row">
            {proposal.file_sha256 ? <a className="cb-button cb-button-outline cb-button-sm" href={`${base}/pdf`} target="_blank" rel="noreferrer"><IconExternalLink size={14} stroke={1.9} aria-hidden />Open PDF</a> : null}
            {proposal.status === "published" ? <Link className="cb-button cb-button-outline cb-button-sm" href={`/proposals/${proposal.slug}`}>Public page</Link> : null}
            <PdfButton label="Replace PDF" variant="outline" busy={busy === "upload"} onFile={(file) => run("upload", () => adminUpload(proposal.person_id, file))} />
            {!proposal.owner_consented && proposal.status !== "removed" ? <button type="button" className="cb-button cb-button-outline cb-button-sm" onClick={() => setPanel("permission")}>{proposal.permission_basis ? "Edit permission" : "Record permission"}</button> : null}
            {proposal.needs_confirmation && !proposal.pii_confirmed && proposal.file_sha256 ? (
              <span className="cb-hub-actions">
                <Check checked={checked} onChange={setChecked}>Checked; no personal details</Check>
                <button type="button" className="cb-button cb-button-outline cb-button-sm" disabled={!checked || busy !== null}
                  onClick={() => run("confirm", () => callApi(`${base}/confirm`, { body: { sha256: proposal.file_sha256 } }))}>Confirm</button>
              </span>
            ) : null}
            {proposal.status === "draft" && proposal.file_sha256 ? <button type="button" className="cb-button cb-button-ink cb-button-sm" disabled={busy !== null}
              onClick={() => run("publish", () => callApi(`${base}/publish`, { body: {} }))}>{busy === "publish" ? "Publishing…" : "Publish"}</button> : null}
            {proposal.status !== "removed" ? <button type="button" className="cb-hub-text-button" data-tone="down" onClick={() => setPanel("remove")}>Remove</button> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

const BASES = [
  { value: "author_consent", label: "The author agreed" },
  { value: "rights_holder_consent", label: "The rights holder agreed" },
  { value: "already_cc_by_4_0", label: "Already published under CC BY 4.0" },
];

function PermissionForm({ base, onDone }: { base: string; onDone: () => void }) {
  const { busy, error, run } = useAction();
  const [basis, setBasis] = useState("author_consent");
  const [note, setNote] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [givenAt, setGivenAt] = useState("");
  return (
    <div className="cb-hub-inline-form">
      <Picker label="Basis" placeholder="Choose" value={basis} options={BASES} onChange={setBasis} />
      <TextArea label="How permission was given" value={note} onChange={setNote} max={2000} rows={2} placeholder="Email from the author on …" />
      <div className="cb-cm-form-row">
        <TextField label="Date given" value={givenAt} onChange={setGivenAt} max={10} counter={false} placeholder="YYYY-MM-DD" inputMode="numeric" />
        <TextField label={basis === "already_cc_by_4_0" ? "CC BY 4.0 source" : "Source link (optional)"} type="url" inputMode="url" value={sourceUrl} onChange={setSourceUrl} max={2048} counter={false} placeholder="https://" />
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="cb-hub-actions" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="cb-button cb-button-outline cb-button-sm" onClick={onDone}>Cancel</button>
        <button type="button" className="cb-button cb-button-ink cb-button-sm" disabled={busy !== null || note.trim().length < 3 || !givenAt}
          onClick={() => run("permission", () => callApi(`${base}/permission`, { body: { basis, note, sourceUrl: sourceUrl || null, givenAt } })).then((ok) => { if (ok) onDone(); })}>
          {busy ? "Saving…" : "Save permission"}
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────────── posts ───────────────────────────── */

export function AdminPosts({ posts }: { posts: AdminPostRow[] }) {
  return (
    <div className="cb-hub-grid">
      <div className="cb-card">
        <div className="cb-card-head"><div><h3>Recent posts</h3><p>Hide posts with personal data, spam or the wrong project. Hidden posts stay stored so the link cannot be added again.</p></div></div>
        <ul className="cb-hub-list">{posts.length ? posts.map((post) => <PostRow key={post.id} post={post} />) : <li><span className="cb-hub-hint">No posts yet</span></li>}</ul>
      </div>
      <aside className="cb-hub-stack"><AddPostForm /></aside>
    </div>
  );
}

function PostRow({ post }: { post: AdminPostRow }) {
  const { busy, error, run } = useAction();
  const [hiding, setHiding] = useState(false);
  return (
    <li>
      <div className="cb-hub-list-main">
        <a className="cb-inline-link" href={post.url} target="_blank" rel="noreferrer">{post.title || post.url}</a>
        <small>{post.archived_name} · {post.year} · {post.organization_name} · {post.source === "admin" ? "added by admin" : `by ${post.author ?? "unknown"} (${post.verification ?? "no claim"})`} · {formatDate(post.created_at)}</small>
        {post.hidden ? <small>Hidden: {post.hidden_reason}</small> : null}
        {hiding ? <ReasonForm label="Why is it hidden? The author sees this." action="Hide post" busy={busy === "hide"} onCancel={() => setHiding(false)}
          onSubmit={(reason) => run("hide", () => callApi(`/api/v2/admin/posts/${post.id}`, { body: { hidden: true, reason } })).then(() => setHiding(false))} /> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
      </div>
      {!hiding ? (post.hidden
        ? <button type="button" className="cb-button cb-button-outline cb-button-sm" disabled={busy !== null} onClick={() => run("show", () => callApi(`/api/v2/admin/posts/${post.id}`, { body: { hidden: false } }))}>Show again</button>
        : <button type="button" className="cb-hub-text-button" data-tone="down" onClick={() => setHiding(true)}>Hide</button>) : null}
    </li>
  );
}

function AddPostForm() {
  const { busy, error, run } = useAction();
  const [person, setPerson] = useState<PersonMatch | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<PostKind>("final_report");
  const [publishedOn, setPublishedOn] = useState("");
  return (
    <div className="cb-card">
      <div className="cb-card-head"><div><h3>Add a post for a contributor</h3><p>Link only; the post stays on their site.</p></div></div>
      {person ? (
        <div className="cb-hub-steps">
          <Notice>{person.archived_name} · {person.year} · {person.project_title} <button type="button" className="cb-hub-text-button" onClick={() => setPerson(null)}>Change</button></Notice>
          <TextField label="Link" type="url" inputMode="url" value={url} onChange={setUrl} max={2048} counter={false} placeholder="https://" />
          <TextField label="Title (optional)" value={title} onChange={setTitle} max={140} />
          <Picker label="Type" placeholder="Choose" value={kind} options={POST_KINDS.map((item) => ({ value: item.value, label: item.label }))} onChange={(value) => setKind(value as PostKind)} />
          <TextField label="Published on (optional)" value={publishedOn} onChange={setPublishedOn} max={10} counter={false} placeholder="YYYY-MM-DD" inputMode="numeric" />
          {error ? <Notice tone="error">{error}</Notice> : null}
          <button type="button" className="cb-button cb-button-ink cb-button-sm" disabled={!url.trim() || busy !== null}
            onClick={() => run("add", () => callApi("/api/v2/admin/posts", { body: { personId: person.person_id, url: url.trim(), title: title.trim() || null, kind, publishedOn: publishedOn.trim() || null } }))
              .then((ok) => { if (ok) { setUrl(""); setTitle(""); setPublishedOn(""); } })}>{busy ? "Adding…" : "Add post"}</button>
        </div>
      ) : <PersonSearch onPick={setPerson} />}
    </div>
  );
}
