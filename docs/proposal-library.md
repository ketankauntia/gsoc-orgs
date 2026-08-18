# Verified GSoC Proposal Library

The proposal library lets past Google Summer of Code contributors share an accepted proposal PDF with the community after identity review and moderation. Approved proposals are published under CC BY 4.0 so future applicants can learn from real examples without exposing unreviewed submissions or private verification material.

## Contributor flow

1. Sign in with Google and complete a public profile.
2. Find the archived contributor slot associated with your past GSoC project.
3. Submit a claim with optional private evidence for a moderator.
4. Upload the accepted proposal as a PDF.
5. Accept the publication and CC BY 4.0 terms, then submit it for review.
6. Respond to requested changes when necessary.
7. Once approved, the proposal appears in the public library with the contributor's chosen public profile fields.

Claims, draft PDFs, evidence, moderator notes, and rejected submissions are never part of the public API or public pages.

## Administrator-curated imports

An administrator may publish a proposal received directly from a contributor without creating or impersonating a contributor account. The import must reference a real archived contributor slot, record a publication-rights basis and private permission note, and pass the same PDF validation and private-storage pipeline as a contributor upload.

Only the public attribution, archived project context, license, and validated document appear in the public projection. Permission notes, source records, and administrator identities remain private. Both the admin page and every mutation API re-check the administrator role on the server; hiding the controls is not treated as authorization.

## Architecture

- **Supabase Auth** handles Google OAuth sessions using the server-side PKCE flow.
- **Supabase Postgres** stores the canonical organization/project catalog, contributor claims, profiles, proposal metadata, roles, and moderation events.
- **Row Level Security and database functions** enforce ownership, claim limits, role checks, and valid workflow transitions even when an API is called outside the UI.
- **Cloudflare R2** stores proposal PDFs and imported profile avatars in a private bucket.
- **A Cloudflare Worker gateway** accepts only short-lived HMAC-signed operations for narrowly allowed object paths. The browser never receives a bucket credential.
- **Next.js route handlers** authenticate users, validate PDF content, record consent, and expose separate contributor, moderator, and public APIs.
- **`approved_proposals`** is the deliberately limited public database projection. It contains approved proposal metadata and visibility-filtered profile data, but not email, evidence, private notes, storage keys, or moderation history.
- **`published_contributor_blogs`** exposes only curated public URLs and archived project context. Raw curator records remain inaccessible to anonymous and authenticated clients.

## Proposal lifecycle

The main proposal states are:

```text
draft -> pending -> approved
                  -> changes_requested -> pending
                  -> rejected
```

An administrator can reopen a proposal when necessary. Reopening removes it from public results immediately. Draft deletion releases an unverified claim; a proposal attached to a verified identity is withdrawn instead of rewriting the historical verification record.

Approval requires all of the following:

- a verified contributor claim;
- an active, complete contributor profile;
- a structurally valid current PDF;
- explicit publication and CC BY 4.0 consent; and
- a moderator who is not reviewing their own submission.

## PDF storage and validation

Uploads use a short-lived signed `PUT` to a unique quarantine key. The storage gateway restricts keys to proposal quarantine, approved proposal files, and profile avatars; it also binds the HTTP method, path, expiry, content type, and download disposition into the signature.

When upload completion is reported, the server verifies:

- `application/pdf` metadata;
- a maximum size of 10 MiB;
- the `%PDF-` signature;
- successful structural parsing and at least one page; and
- a SHA-256 digest and stable byte length.

Only the validated bytes are promoted to the proposal path. Abandoned quarantine uploads expire automatically. PDF download routes re-check the viewer's authorization or public approval state before issuing a short-lived signed URL.

## Public and protected APIs

Public catalog and approved-proposal reads live under `/api/v2`. Account routes use `/api/v2/me`, and moderation/role routes use `/api/v2/admin`. Protected routes use private, non-cacheable responses and independently verify the current Supabase user.

The administrator proposal-import and contributor-blog endpoints also live under `/api/v2/admin`, so the same operations can be driven by the admin UI or an authenticated HTTP client. They do not accept a shared admin key or expose service credentials.

The older unversioned and `/api/v1` catalog endpoints remain available for compatibility. Their response shapes are derived from the canonical Supabase catalog after the legacy data migration.

## Local setup

Copy `.env.example` to `.env.local` and configure the listed Supabase, Google OAuth, R2 gateway, and administrator variables. Never commit `.env.local`, OAuth client JSON files, service-role credentials, signing secrets, database exports, or signed URLs.

Apply the database migration and import the finalized catalog:

```bash
npm run supabase:import:dry-run
npm run supabase:import
npm run supabase:reconcile
```

The one-time Mongo compatibility import uses private exports under `migration/mongo-export/`:

```bash
npm run supabase:import:mongo
```

Deploy and verify the private R2 gateway:

```bash
npm run r2:deploy
npm run r2:verify
```

Before bootstrapping an administrator, the configured email must sign in through Google once so a real Supabase Auth user exists:

```bash
npm run supabase:bootstrap-admins
```

Run the complete local gate before opening a pull request:

```bash
npm run type-check
npm run lint
npm test
npm run build
npm run security:audit
```

Environment-dependent OAuth, RLS ownership, upload CORS, and contributor-versus-moderator tests should also be completed in a disposable or staging environment before a production release.

## Privacy and security expectations

- Do not log request bodies, cookies, OAuth tokens, signed URLs, claim evidence, private notes, or raw database errors.
- Do not expose the Supabase service role or storage signing secret to client code.
- Do not use archived contributor names as automatic identity proof; claim verification remains a human moderation decision.
- Do not add analytics that rank or secretly monitor individual contributors.
- Preserve the distinction between public profile choices and private account data.
- Report suspected vulnerabilities privately according to [SECURITY.md](../SECURITY.md).

## Key implementation locations

- `supabase/migrations/202608120001_proposal_library.sql` — schema, RLS, database functions, and public projection.
- `supabase/migrations/202608180001_admin_imports_and_contributor_blogs.sql` — isolated curated imports, contributor blog links, role checks, audit writes, and public projections.
- `app/api/v2/` — public, contributor, and moderator APIs.
- `lib/proposals/` — proposal validation and query contracts.
- `lib/r2.ts` — server-side signed storage operations and PDF validation.
- `cloudflare/proposal-storage-worker.ts` — private R2 object gateway.
- `scripts/import-supabase-catalog.ts` — canonical catalog importer.
- `scripts/import-legacy-mongo-export.ts` — one-time compatibility-data importer.
- `scripts/reconcile-supabase-catalog.ts` — imported-count reconciliation.
- `scripts/verify-r2-gateway.ts` — disposable live storage verification.
