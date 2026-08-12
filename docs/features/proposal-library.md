# GSoC Proposal Library

The proposal library lets a contributor claim a finalized archived GSoC contributor slot, upload the accepted proposal as a private PDF, and publish it only after manual moderation. The public artifact is licensed CC BY 4.0.

## Architecture

- Supabase Postgres is the canonical catalog, identity, claim, proposal, role, and audit database.
- Supabase Auth provides Google OAuth with PKCE and cookie-based SSR.
- A private Cloudflare R2 bucket stores imported Google avatars and proposal PDFs.
- Checked-in JSON under `new-api-details/` remains a generated read optimization for static catalog pages.
- `/api/v1` and unversioned compatibility routes retain their existing response envelopes; `/api/v2` uses `{ data, meta }` and `{ error }` envelopes.

Apply `supabase/migrations/202608120001_proposal_library.sql`, configure Google OAuth in Supabase, configure `.env.local` from `.env.example`, apply `supabase/r2-cors.json` and `supabase/r2-lifecycle.json`, then run:

```bash
npm run supabase:import:dry-run
npm run supabase:import
npm run supabase:import:mongo
npm run supabase:reconcile
npm run supabase:bootstrap-admins
```

Create one-time JSON exports named `organizations.json`, `projects.json`, and `waitlist_entries.json` under `migration/mongo-export/` (JSON arrays or JSON Lines), or set `MONGO_EXPORT_DIR` to their directory. The legacy importer preserves Mongo IDs and source payloads so v1 shapes can be reproduced, and imports the waitlist. Regenerate database types after applying a migration with `npm run supabase:types` against a local Supabase stack. For a linked hosted project, replace `--local` with `--project-id <ref>`.

## Security invariants

- Claims are created only through a transaction-locked RPC. One account may have at most two non-rejected claims and one active claim per year.
- Only archived projects through 2025 are claimable until a finalized later dataset is imported.
- A contributor slot can be verified for only one account.
- Email remains in `auth.users` and is absent from all public views and APIs.
- Public proposal reads use `approved_proposals`; profile avatar, bio, and links are included only when their visibility toggle permits it.
- Users never write status, roles, license acceptance, validation, hashes, or R2 keys directly.
- Moderator/admin decisions and role changes append immutable audit events.

## PDF lifecycle

The browser receives a ten-minute presigned PUT for one `application/pdf` object under `quarantine/{userId}/{uploadId}.pdf`. Completion checks R2 metadata, the 10 MiB limit, `%PDF-` magic bytes, and structural parsing, computes SHA-256, then promotes the object to `proposals/{proposalId}/{versionId}.pdf`. Abandoned quarantine objects expire after one day.

PDF reads always pass through an authorization/status route and return a five-minute signed URL. Embedded previews use a sandboxed iframe and retain a normal download fallback. This release validates format and structure and uses safe delivery headers; it does not send private submissions to a third-party malware scanner.

## Workflow

`draft -> pending -> approved` and `pending -> changes_requested -> pending` are the normal paths. Pending, approved, rejected, and withdrawn records are locked. Reopening is admin-only and immediately removes an approved proposal from public reads. Deleting an unverified draft deletes its claim and releases capacity; withdrawing a proposal tied to a verified claim does not release capacity.

Approval requires a verified claim, a valid current PDF, a complete active profile, and recorded CC BY 4.0 consent. Rejection, changes requested, and reopening require a private reason.

## Production cutover

1. Export a read-only Mongo snapshot and retain it for rollback.
2. Import and reconcile the 2016–2025 checked-in snapshots and the final Mongo delta in staging.
3. Snapshot representative v1 payloads, then run the same requests against Supabase.
4. Freeze legacy writes briefly, import the final waitlist/catalog delta, regenerate static JSON, and deploy.
5. Verify homepage, blog HTML/Markdown/RSS/sitemap, v1, v2, OAuth, R2 CORS, contributor workflow, moderation, and approved PDF access.
6. Keep the Mongo snapshot read-only until the release is accepted. Rollback restores the previous deployment and Mongo environment; never roll back Supabase by deleting migrated data.

Environment-dependent RLS, OAuth, R2 CORS, and presigned-upload tests are staging release gates; local lint/type/unit/build checks cannot substitute for them.
