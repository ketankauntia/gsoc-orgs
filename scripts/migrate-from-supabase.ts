import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { scanForPii } from "../lib/pii";
import { scriptDb } from "./lib/db";

// One-time move of user content from the old Supabase project to Neon.
// Reads Supabase over its REST API with the service-role key (read-only) and
// writes to Neon only with --commit. Safe to re-run: migrated rows are skipped.
//
//   npx tsx scripts/migrate-from-supabase.ts            dry run: plan and problems
//   npx tsx scripts/migrate-from-supabase.ts --commit   write to Neon and copy PDFs in R2
//
// Needs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (old project),
// NEON_DATABASE_URL_UNPOOLED (Neon, migrations and catalog import already run),
// R2_GATEWAY_URL, R2_SIGNING_SECRET (the Worker must accept proposals/<id>.pdf).
// Writes a private export (waitlist, links that no longer fit) to .local/.

const COMMIT = process.argv.includes("--commit");
const TERMS_VERSION = "legacy-2026-08";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required in .env.local`);
  return value;
}

const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
const sql = scriptDb();

type Row = Record<string, unknown>;

/** Every row of a Supabase table, paged through the REST API in a stable order. */
async function rest<T = Row>(table: string, select = "*", order = "id"): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=${order}.asc&limit=1000&offset=${offset}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!response.ok) throw new Error(`Supabase ${table}: ${response.status} ${await response.text()}`);
    const page = (await response.json()) as T[];
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

async function authUsers() {
  const users: Array<{ id: string; email: string | null }> = [];
  for (let page = 1; ; page += 1) {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!response.ok) throw new Error(`Supabase auth users: ${response.status}`);
    const body = (await response.json()) as { users: Array<{ id: string; email: string | null }> };
    users.push(...body.users);
    if (body.users.length < 1000) return users;
  }
}

// ─────────────── R2 through the signing gateway (same scheme as lib/r2.ts) ───────────────

function signedUrl(method: "GET" | "PUT" | "DELETE", key: string, contentType = "") {
  const gateway = env("R2_GATEWAY_URL").replace(/\/$/, "");
  const pathname = `/objects/${key.split("/").map(encodeURIComponent).join("/")}`;
  const url = new URL(`${gateway}${pathname}`);
  const expires = String(Math.floor(Date.now() / 1000) + 300);
  url.searchParams.set("expires", expires);
  if (contentType) url.searchParams.set("contentType", contentType);
  url.searchParams.set("signature", createHmac("sha256", env("R2_SIGNING_SECRET")).update(`${method}\n${pathname}\n${expires}\n${contentType}\n`).digest("hex"));
  return url;
}

async function readObject(key: string) {
  const response = await fetch(signedUrl("GET", key));
  if (!response.ok) throw new Error(`R2 GET ${key}: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

async function writeObject(key: string, bytes: Uint8Array) {
  const response = await fetch(signedUrl("PUT", key, "application/pdf"), { method: "PUT", body: Uint8Array.from(bytes).buffer, headers: { "Content-Type": "application/pdf" } });
  if (!response.ok) throw new Error(`R2 PUT ${key}: ${response.status}`);
}

async function deleteObject(key: string) {
  const response = await fetch(signedUrl("DELETE", key), { method: "DELETE" });
  if (!response.ok) throw new Error(`R2 DELETE ${key}: ${response.status}`);
}

async function inspectPdf(bytes: Uint8Array) {
  const pages = (await PDFDocument.load(bytes, { ignoreEncryption: false })).getPageCount();
  let text: string[] = [];
  try {
    const { extractText } = await import("unpdf");
    text = (await extractText(Uint8Array.from(bytes), { mergePages: false })).text.map((page) => page.replace(/\s+/g, " ").trim());
  } catch {
    text = [];
  }
  const status = text.join(" ").length >= 200 ? "ok" : "failed";
  return { pages, status, text: text.join("\f").slice(0, 400_000) || null, findings: status === "ok" ? scanForPii(text) : [], sha256: createHash("sha256").update(bytes).digest("hex") };
}

// ─────────────────────────────── mapping helpers ───────────────────────────────

const AVATAR_KEY = /^avatars\/[0-9a-f-]{36}\/google-[0-9a-f]{16}\.(jpg|png|webp)$/;
const githubUser = (url: string) => url.match(/^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})\/?$/i)?.[1] ?? null;
const xUser = (url: string) => url.match(/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/@?([A-Za-z0-9_]{1,15})\/?$/i)?.[1] ?? null;
const https = (url: string) => (/^https:\/\/\S+$/i.test(url) && url.length <= 300 ? url : null);

async function main() {
  const report: Record<string, number> = {};
  const count = (key: string, by = 1) => { report[key] = (report[key] ?? 0) + by; };
  const problems: string[] = [];
  const exported: Record<string, unknown[]> = { waitlist: [], unmigratedLinks: [] };
  const message = (error: unknown) => (error instanceof Error ? error.message : String(error));
  /** One row's writes; a failure is reported and the run carries on (re-runs skip what landed). */
  async function attempt(label: string, write: () => Promise<unknown>) {
    try {
      await write();
    } catch (error) {
      count("failed");
      problems.push(`${label}: ${message(error)}`);
    }
  }

  // New contributor slots by (external id, ordinal).
  const people = await sql`select pp.id, p.external_id, pp.ordinal from public.project_people pp join public.projects p on p.id = pp.project_id where pp.role = 'contributor'`;
  if (!people.length) throw new Error("Neon has no catalog yet. Run npm run db:migrate and npm run db:import-catalog first.");
  const personBySlot = new Map(people.map((row) => [`${row.external_id}:${row.ordinal}`, String(row.id)]));

  const [users, profiles, links, slots, claims, proposals, files, imports, importFiles, blogs, waitlist] = await Promise.all([
    authUsers(),
    rest("profiles", "*", "user_id"),
    rest("profile_links"),
    rest<{ id: string; ordinal: number; projects: { external_id: string } | null }>("project_contributors", "id,ordinal,projects(external_id)"),
    rest("contributor_claims"),
    rest("proposals"),
    rest("proposal_files"),
    rest("admin_proposal_imports"),
    rest("admin_proposal_files"),
    rest("contributor_blogs"),
    rest("waitlist_entries"),
  ]);
  const newPerson = new Map(slots.map((slot) => [slot.id, slot.projects ? personBySlot.get(`${slot.projects.external_id}:${slot.ordinal}`) : undefined]));
  const fileById = new Map(files.map((file) => [String(file.id), file]));
  const importFileById = new Map(importFiles.map((file) => [String(file.id), file]));
  const emailByUser = new Map(users.map((user) => [user.id, user.email]));
  exported.waitlist = waitlist;

  // 1. Accounts and profiles, kept under the old user id until the person signs in again.
  const linksByUser = new Map<string, Row[]>();
  for (const link of links) linksByUser.set(String(link.user_id), [...(linksByUser.get(String(link.user_id)) ?? []), link]);
  for (const profile of profiles) {
    const userId = String(profile.user_id);
    const email = emailByUser.get(userId);
    const fields = { website: null as string | null, github: null as string | null, x: null as string | null, medium: null as string | null };
    for (const link of linksByUser.get(userId) ?? []) {
      const url = String(link.url);
      const platform = String(link.platform);
      if (platform === "github" && !fields.github && githubUser(url)) fields.github = githubUser(url);
      else if (platform === "x" && !fields.x && xUser(url)) fields.x = xUser(url);
      else if (platform === "medium" && !fields.medium && https(url)) fields.medium = https(url);
      else if (platform === "portfolio" && !fields.website && https(url)) fields.website = https(url);
      else exported.unmigratedLinks.push({ user_id: userId, platform, url });
    }
    count("profiles");
    if (!email) problems.push(`profile ${userId} has no email; it cannot be reclaimed at sign-in`);
    if (!COMMIT) continue;
    await attempt(`profile ${userId}`, async () => {
      if (email) await sql`insert into private.legacy_accounts(legacy_user_id, email) values (${userId}::uuid, ${email}) on conflict do nothing`;
      await sql`
        insert into public.profiles(user_id, display_name, bio, avatar_key, website_url, github_username, x_username, medium_url, status, created_at)
        values (${userId}::uuid, ${String(profile.display_name).slice(0, 80)}, ${(profile.bio as string | null) ?? null},
          ${AVATAR_KEY.test(String(profile.avatar_r2_key ?? "")) ? profile.avatar_r2_key : null},
          ${fields.website}, ${fields.github}, ${fields.x}, ${fields.medium},
          ${profile.status === "active" ? "active" : "suspended"}, ${String(profile.created_at)}::timestamptz)
        on conflict (user_id) do nothing`;
    });
  }

  // 2. Claims become participations; pending ones stay unverified.
  const personByClaim = new Map<string, string>();
  for (const claim of claims) {
    const personId = newPerson.get(String(claim.project_contributor_id));
    if (!personId) { problems.push(`claim ${claim.id}: archive slot not found in Neon`); continue; }
    personByClaim.set(String(claim.id), personId);
    const verification = claim.status === "verified" ? "verified" : claim.status === "rejected" ? "rejected" : "unverified";
    count(`claims:${verification}`);
    if (!COMMIT) continue;
    await attempt(`claim ${claim.id}`, () => sql`
      insert into public.participations(person_id, user_id, verification, reviewed_at, reviewed_by, rejection_reason, note, evidence_urls, created_at)
      values (${personId}::uuid, ${String(claim.user_id)}::uuid, ${verification},
        ${verification === "unverified" ? null : (claim.verified_at as string | null) ?? String(claim.updated_at)}::timestamptz,
        ${(claim.verified_by as string | null) ?? null}::uuid,
        ${verification === "rejected" ? (claim.rejection_reason as string | null) ?? "Rejected before the move" : null},
        ${(claim.claimant_note as string | null) ?? null}, ${(claim.evidence_urls as string[] | null) ?? []}::text[], ${String(claim.created_at)}::timestamptz)
      on conflict (user_id, person_id) do nothing`);
  }

  // 3. Proposals: one per slot, one file at proposals/<id>.pdf.
  const existing = new Set((await sql`select person_id from public.proposals`).map((row) => String(row.person_id)));
  async function moveProposal(options: {
    label: string; personId: string; slug: string; fileKey: string; uploadedBy: string; uploadedAt: string;
    status: "published" | "draft"; publishedAt: string | null; locked: boolean;
    consent: { acceptedAt: string } | null; permission: { basis: string; note: string; sourceUrl: string | null; givenAt: string } | null;
  }) {
    if (existing.has(options.personId)) { count("proposals:skipped-existing"); return; }
    count(`proposals:${options.status}`);
    if (!COMMIT) return;
    const id = randomUUID();
    const newKey = `proposals/${id}.pdf`;
    let written = false;
    try {
      const bytes = await readObject(options.fileKey);
      const pdf = await inspectPdf(bytes);
      await writeObject(newKey, bytes);
      written = true;
      // Published before the move means a moderator already accepted the file.
      const confirmed = options.status === "published" ? pdf.sha256 : null;
      const inserted = await sql`
        insert into public.proposals(id, person_id, slug, status, locked_at, file_key, file_sha256, file_bytes, file_pages, file_version,
          file_uploaded_by, file_uploaded_at, extraction_status, text_content, pii_findings, pii_confirmed_sha256,
          licence_accepted_at, terms_version, permission_basis, permission_note, permission_source_url, permission_given_at, published_at)
        values (${id}::uuid, ${options.personId}::uuid, ${options.slug}, ${options.status}, ${options.locked ? options.publishedAt : null}::timestamptz,
          ${newKey}, ${pdf.sha256}, ${bytes.byteLength}, ${pdf.pages}, 1, ${options.uploadedBy}::uuid, ${options.uploadedAt}::timestamptz,
          ${pdf.status}, ${pdf.text}, ${JSON.stringify(pdf.findings)}::jsonb, ${confirmed},
          ${options.consent?.acceptedAt ?? null}::timestamptz, ${options.consent ? TERMS_VERSION : null},
          ${options.permission?.basis ?? null}, ${options.permission?.note ?? null}, ${options.permission?.sourceUrl ?? null}, ${options.permission?.givenAt ?? null}::date,
          ${options.publishedAt}::timestamptz)
        on conflict (person_id) do nothing
        returning id`;
      if (!inserted.length) throw new Error("the slot already has a proposal");
      existing.add(options.personId);
      if (options.status === "published" && pdf.findings.length) problems.push(`${options.label}: published with ${pdf.findings.length} contact detail(s) found; review it`);
    } catch (error) {
      count("proposals:failed");
      problems.push(`${options.label}: not migrated (${message(error)})`);
      // The row never landed, so the copied file would be an orphan.
      if (written) await deleteObject(newKey).catch((cleanup) => problems.push(`${options.label}: delete orphaned ${newKey} by hand (${message(cleanup)})`));
    }
  }

  for (const proposal of proposals) {
    const personId = personByClaim.get(String(proposal.claim_id));
    const status = String(proposal.status);
    if (!personId || ["rejected", "withdrawn"].includes(status)) { count(`proposals:not-migrated:${status}`); continue; }
    const file = proposal.current_file_id ? fileById.get(String(proposal.current_file_id)) : undefined;
    if (!file || file.validation_status !== "valid") { count("proposals:no-file"); continue; }
    const published = status === "approved";
    await moveProposal({
      label: `proposal ${proposal.public_slug}`, personId, slug: String(proposal.public_slug), fileKey: String(file.r2_key),
      uploadedBy: String(proposal.user_id), uploadedAt: String(file.created_at),
      status: published ? "published" : "draft", publishedAt: published ? String(proposal.reviewed_at ?? proposal.updated_at) : null, locked: published,
      consent: published && proposal.license_accepted_at ? { acceptedAt: String(proposal.license_accepted_at) } : null, permission: null,
    });
  }

  for (const imported of imports) {
    const personId = newPerson.get(String(imported.project_contributor_id));
    const file = imported.current_file_id ? importFileById.get(String(imported.current_file_id)) : undefined;
    if (!personId || imported.status === "withdrawn" || !file) { count("imports:not-migrated"); continue; }
    const basis = imported.rights_basis === "public_license" ? "already_cc_by_4_0" : String(imported.rights_basis);
    if (imported.rights_basis === "public_license") problems.push(`import ${imported.public_slug}: check that the source licence is CC BY 4.0`);
    await moveProposal({
      label: `import ${imported.public_slug}`, personId, slug: String(imported.public_slug), fileKey: String(file.r2_key),
      uploadedBy: String(imported.imported_by), uploadedAt: String(file.created_at),
      status: imported.status === "published" ? "published" : "draft", publishedAt: imported.status === "published" ? String(imported.published_at ?? imported.updated_at) : null, locked: false,
      consent: null,
      permission: { basis, note: String(imported.permission_note), sourceUrl: (imported.source_url as string | null) ?? null, givenAt: String(imported.created_at).slice(0, 10) },
    });
  }

  // 4. Admin-added blog links become posts.
  for (const blog of blogs) {
    const personId = newPerson.get(String(blog.project_contributor_id));
    if (!personId) { problems.push(`blog ${blog.id}: archive slot not found`); continue; }
    count("posts");
    if (!COMMIT) continue;
    await attempt(`blog ${blog.id}`, () => sql`
      insert into public.posts(person_id, created_by, source, url, normalized_url, title, kind, hidden, hidden_at, hidden_reason, created_at)
      values (${personId}::uuid, ${String(blog.created_by)}::uuid, 'admin', ${String(blog.url)}, private.normalize_url(${String(blog.url)}),
        ${(blog.title as string | null) ?? null}, 'other', ${!blog.is_published}, ${blog.is_published ? null : new Date().toISOString()}::timestamptz,
        ${blog.is_published ? null : "Unpublished before the move"}, ${String(blog.created_at)}::timestamptz)
      on conflict (person_id, normalized_url) do nothing`);
  }

  const exportDir = path.join(process.cwd(), ".local");
  fs.mkdirSync(exportDir, { recursive: true });
  const exportFile = path.join(exportDir, `supabase-export-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(exportFile, JSON.stringify(exported, null, 2));

  console.log(JSON.stringify({ mode: COMMIT ? "commit" : "dry run", counts: report, waitlist: waitlist.length, unmigratedLinks: exported.unmigratedLinks.length, problems }, null, 2));
  console.log(`Private export written to ${exportFile} (git-ignored).`);
  if (!COMMIT) console.log("Nothing was written. Re-run with --commit after the Worker accepts proposals/<id>.pdf.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
