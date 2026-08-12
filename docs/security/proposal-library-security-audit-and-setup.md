# Proposal Library security audit and production setup

Last reviewed: 2026-08-12
Scope: proposal library, Supabase migration/auth/RLS, Cloudflare R2 upload and download paths, moderation, public proposal pages, v2 APIs, and related legacy admin endpoints.

## Executive result

The repository-level audit is complete and all findings discovered in this review were fixed. The local gates pass: 16 tests, ESLint with zero warnings, TypeScript, deterministic catalog import dry-run, dependency audit, and production build.

This is not a claim that software can have zero bugs. A complete release decision still requires a disposable Supabase project, a private R2 bucket, Google OAuth credentials, and two or more test accounts. Those external systems were not available in this checkout, so the live RLS, OAuth, R2 CORS, and end-to-end moderation checks in this document are mandatory release gates—not optional follow-up work.

Do not expose this feature to production until every item in **Staging security verification** passes.

## Threat model

Protected assets:

- Account email, OAuth sessions, private claimant notes, and evidence URLs.
- Pending/rejected proposal PDFs and all R2 credentials.
- Claim capacity, contributor-slot ownership, license consent, moderation state, and role assignments.
- Public attribution and approved proposal integrity.
- Service-role, admin-key, Google OAuth, and R2 secrets.

Principal attackers considered:

- An anonymous visitor enumerating private submissions.
- One authenticated contributor attempting to read or mutate another contributor's records.
- A contributor calling Supabase RPCs directly instead of through the Next.js UI.
- Cross-site request forgery, malicious OAuth redirect input, SSRF through a forged avatar URL, oversized request bodies, spoofed PDFs/images, stored links, and metadata forgery.
- A moderator attempting to review their own submission or bypass state prerequisites.
- Credential leakage through browser bundles, caches, referrers, API errors, logs, or public projections.
- Concurrent claim creation intended to bypass the two-participation cap.

Trust boundaries:

1. The browser holds only the Supabase publishable key and session cookies.
2. Next.js revalidates the user on every protected handler. `proxy.ts` is only an optimistic redirect/refresh layer.
3. Supabase RLS and security-definer RPCs enforce ownership and state transitions even when a user bypasses the UI.
4. The Supabase service-role and R2 S3 credentials exist only in the server environment.
5. R2 is private. Browsers receive a ten-minute, one-object `PUT` URL or a short-lived `GET` URL only after authorization.

## Findings and fixes

| Severity | Finding | Resolution |
|---|---|---|
| Critical | Authenticated users could call the file-attachment RPC directly and forge R2 key, hash, size, or validation metadata. | `attach_proposal_file` is service-role-only, receives an explicit authenticated owner ID from the server, locks the proposal, and checks owner/status/size. |
| Critical | Authenticated users could call proposal submission directly and record protected CC BY acceptance fields without server-recorded consent. | Submission RPC is service-role-only. The handler validates both consent booleans, user identity, rate limit, owner, active profile, current valid PDF, and editable status. |
| High | Avatar import trusted editable `user_metadata`, followed arbitrary redirects, and could be used for SSRF. | Source now comes from the Google provider identity; only HTTPS `googleusercontent.com`/`ggpht.com` hosts and their subdomains are allowed; credentials/ports are rejected; every redirect is revalidated; response size, MIME, and magic bytes are checked. |
| High | OAuth/login redirects accepted insufficiently validated paths and trusted `x-forwarded-host`. | A shared relative-path validator rejects absolute, protocol-relative, backslash, and control-character inputs. Production callbacks use `NEXT_PUBLIC_SITE_URL`, never a forwarded host. |
| High | Cookie-authenticated mutation handlers had no explicit same-origin defense. | All proposal/admin/profile/sign-out mutations reject cross-site fetches and mismatched `Origin` headers. JSON handlers also require `application/json` and cap bodies at 32 KiB (16 KiB for legacy cache administration). |
| High | Profile update followed update → delete links → insert links, allowing partial data loss. | `update_my_profile` performs the profile and full link replacement in one locked Postgres transaction. Direct table mutation privileges for links were removed. |
| High | A moderator could act on their own claim/proposal; some approval prerequisites were incomplete. | Moderation now blocks every self-review, restricts valid source states, requires verified claim + current valid PDF + stored CC BY consent for approval, and audits every decision. |
| High | Suspended profiles could retain effective contributor/moderator operations. | Role checks and contributor RPCs require an active profile; server avatar mutation also checks active status. |
| Medium | Rate limits were absent for expensive or sensitive actions. | Atomic Postgres fixed-window limits cover claims, upload URL/completion, submit, avatar refresh, moderation, and role changes. Old buckets are cleaned opportunistically. |
| Medium | Raw database/PDF parser errors could leak internals. | Public responses now use allowlisted business messages or generic errors; detailed errors remain server-side. |
| Medium | PDF and avatar downloads could leak signed URLs through referrers or caches. | Private APIs use `private, no-store`; redirects add `Referrer-Policy: no-referrer`; signed URLs are short-lived; public avatar cache lifetime is shorter than its signature. |
| Medium | PDF download validation relied on `HEAD` size while body collection was unbounded. | The streamed body is capped independently at 10 MiB and its length must still match `HEAD` before PDF parsing and hashing. |
| Medium | Draft deletion removed only the current R2 object and could orphan superseded versions. | The transactional delete RPC returns every proposal file key; the server deletes the full set. Verified claims remain counted and are withdrawn, not deleted. |
| Medium | Public v2 detail queries selected `*`, including source/legacy payloads not in the documented contract. | Organization, project, and admin detail projections now explicitly list required columns. |
| Medium | `/api/v2/years` loaded every project row and could hit the Supabase API row cap. | A database `year_stats` aggregate view now supplies exact totals. Sitemap proposal reads paginate beyond 1,000 records. |
| Medium | R2 CORS permitted browser `GET` and `HEAD` although only direct `PUT` is required. | CORS is restricted to `PUT`, `Content-Type`, the canonical origin, and localhost. |
| Low | Security-sensitive APIs were not covered by optimistic session refresh middleware. | Proxy matching now includes `/api/v2/me/*` and `/api/v2/admin/*`; handlers still independently authenticate/authorize. |
| Low | Legacy admin-key comparison was hand-written and error responses exposed exception details. | It now uses Node's `timingSafeEqual`, fails closed if unset, bounds JSON, and returns generic errors. |
| Low | Basic browser hardening headers were absent. | `nosniff`, same-origin framing, referrer, permissions, and opener policies are set globally. |

The intentional security-definer `approved_proposals` view is a narrow, reviewed exception. It selects only approved proposals with verified claims, valid files, active profiles, and visibility-masked profile fields. It never joins `auth.users` or selects email. Using a security-invoker view here would make the safe public projection unreadable because the underlying personal tables deliberately have no anonymous read policy.

## Verification performed locally

Commands and observed results on 2026-08-12:

```text
npm test
  4 test files passed; 16 tests passed

npm run lint
  passed; zero errors and zero warnings

npm run type-check
  passed

npm run supabase:import:dry-run
  522 organization files
  10 project files (2016–2025)
  10,951 projects/contributor slots
  23,749 mentors
  deterministic source checksum:
  efdc15b99733ac725164901b6e28d5b3460177a607ac518dfd818fd24e14bc35

npm run security:audit
  found 0 production dependency vulnerabilities

next start (local production smoke, without external credentials)
  200: /, /blog, /rss.xml, published article HTML, published article .md,
       /sitemap.xml, /proposals, /login
  security headers present: nosniff, SAMEORIGIN, referrer, permissions policy
  /api/v1/health returned the expected 503 because Supabase credentials were
  intentionally absent from the local test environment
```

The production build is also part of `npm run validate` and must pass immediately before deployment. Static tests cover input schemas, URL/CSRF/JSON helpers, avatar URL and magic-byte checks, v1 response-shape helpers, and critical migration contracts (RLS, claim locking/cap, safe public view, service-only metadata/license RPCs, atomic profile writes, role restrictions, and audit events).

Not executed locally:

- Applying/linting the migration in a real Postgres/Supabase instance. Docker and `psql` are not installed on this workstation.
- Live RLS impersonation, Google callback/session refresh, R2 presigned `PUT`, CORS, object lifecycle expiry, signed `GET`, or full browser E2E. No staging credentials were present.
- A third-party penetration test or private-PDF malware scanner.

## Step-by-step production configuration

### 1. Prepare the workstation

Install Node.js 20 or newer, Git, Docker Desktop (for local Supabase), and the Supabase CLI. Then:

```powershell
git clone <repository-url>
Set-Location gsoc-orgs
npm ci
Copy-Item .env.example .env.local
npx supabase --version
```

Never commit `.env.local`, database exports, OAuth secrets, service-role keys, R2 keys, or signed URLs.

### 2. Create and link a Supabase project

Create a project in the Supabase dashboard and retain its project reference. Obtain the project URL, publishable key, service-role key, and direct database URL from Project Settings. The service-role key bypasses RLS and must never use a `NEXT_PUBLIC_` name.

```powershell
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push --dry-run
npx supabase db push
npx supabase db lint --linked --level warning
npm run supabase:types:linked
```

Review the generated type diff; do not blindly accept it. A fresh environment must apply every file in `supabase/migrations` exactly once. If an earlier draft of `202608120001_proposal_library.sql` was already applied anywhere, do not assume editing that file upgraded the database: rebuild a disposable staging project from the final migration before release, then produce a forward-only delta migration for any existing production database.

Supabase recommends RLS on every exposed table and warns that views and security-definer functions require deliberate privilege design. The implementation follows that model: [RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security) and [API security guide](https://supabase.com/docs/guides/api/securing-your-api).

### 3. Configure Google OAuth

In Google Cloud Console:

1. Configure the OAuth consent screen and request only `openid`, `email`, and `profile`.
2. Create an OAuth 2.0 Client ID of type **Web application**.
3. Add this exact authorized redirect URI:

   `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

4. Store the client ID and secret in Supabase Dashboard → Authentication → Providers → Google.
5. In Supabase Dashboard → Authentication → URL Configuration, set:
   - Site URL: `https://www.gsocorganizationsguide.com`
   - Redirect URLs: `https://www.gsocorganizationsguide.com/auth/callback`
   - Development redirect: `http://localhost:3000/auth/callback`
6. Keep PKCE enabled and do not enable nonce skipping. Supabase SSR uses PKCE and server-confirmed sessions; see the [PKCE guide](https://supabase.com/docs/guides/auth/sessions/pkce-flow) and [SSR client guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

Test both a first login and a refreshed/expired browser session in staging.

### 4. Create the private R2 bucket

In Cloudflare Dashboard → R2:

1. Create a bucket, for example `gsoc-proposals-production`.
2. Keep public access and the `r2.dev` development URL disabled.
3. Create an R2 API token scoped only to this bucket with Object Read & Write permission. Record the access-key ID and secret once.
4. Apply [r2-cors.json](../../supabase/r2-cors.json). With current Wrangler:

   ```powershell
   npx wrangler r2 bucket cors set <BUCKET_NAME> --file supabase/r2-cors.json
   ```

5. In the bucket's lifecycle settings, add a rule named `expire-abandoned-proposal-uploads` with prefix `quarantine/` and expiration after one day. [r2-lifecycle.json](../../supabase/r2-lifecycle.json) is the checked-in desired state.
6. Verify that `https://www.gsocorganizationsguide.com` and `http://localhost:3000` can issue a preflight and `PUT`, while an unrelated origin cannot.

Cloudflare treats presigned URLs as bearer tokens; they remain usable until expiry and should be scoped to one operation and object. Browser use also requires bucket CORS. Review the current [presigned URL documentation](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [CORS documentation](https://developers.cloudflare.com/r2/buckets/cors/), and [lifecycle documentation](https://developers.cloudflare.com/r2/buckets/object-lifecycles/).

### 5. Set environment variables

Set these locally and in the hosting provider's encrypted production environment:

```dotenv
NEXT_PUBLIC_SITE_URL=https://www.gsocorganizationsguide.com

NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
SUPABASE_DB_URL=<direct-database-url-for-operations-only>

SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<google-client-id>
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=<google-client-secret>
ADMIN_BOOTSTRAP_EMAILS=admin1@example.com,admin2@example.com

R2_ACCOUNT_ID=<cloudflare-account-id>
R2_BUCKET_NAME=gsoc-proposals-production
R2_ACCESS_KEY_ID=<bucket-scoped-access-key>
R2_SECRET_ACCESS_KEY=<bucket-scoped-secret>

ADMIN_KEY=<at-least-32-random-bytes-for-legacy-admin-routes>
```

`R2_PUBLIC_URL` is not required for proposal files and should remain unset unless another legacy feature needs it. `LEGACY_MONGO_DATABASE_URL` and `MONGO_DB` are migration-time values only; remove them from production after cutover acceptance.

Generate `ADMIN_KEY` with a cryptographically secure generator, not a memorable password. Restrict access to deployment/environment settings and rotate immediately after any suspected disclosure.

### 6. Import and reconcile catalog data

First take backups. Retain a read-only Mongo snapshot through the rollback window.

```powershell
npm run supabase:import:dry-run
npm run supabase:import
```

For the one-time legacy supplement, export newline-delimited or array JSON into a private directory with these filenames:

```text
migration/mongo-export/organizations.json
migration/mongo-export/projects.json
migration/mongo-export/waitlist_entries.json
```

Then run:

```powershell
$env:MONGO_EXPORT_DIR='migration/mongo-export'
npm run supabase:import:mongo
npm run supabase:reconcile
```

The reconciliation command must report 522 organizations, 10,951 projects, 10,951 contributor slots, and 10,951 projects with valid organization references for the checked-in dataset. Investigate every mismatch before continuing. Keep claims disabled for 2026 until finalized project/contributor data is imported and the database claim-year guard is deliberately advanced.

### 7. Bootstrap the first administrators

Each bootstrap email must complete Google sign-in once so an `auth.users` row exists. Then, from a secured workstation with production secrets:

```powershell
npm run supabase:bootstrap-admins
```

Sign out and back in, visit `/admin/roles`, and grant day-to-day moderators only the `moderator` role. Use at least two admins to reduce lockout risk. Subsequent grants/revocations are audited; the initial service-role bootstrap is the explicit trust root and should be recorded in the deployment ticket.

### 8. Run staging security verification

Use accounts A (contributor), B (contributor), M (moderator), and D (admin). Complete all checks:

- Anonymous REST queries cannot read `profiles`, `profile_links`, `contributor_claims`, `proposals`, `proposal_files`, private schema tables, pending PDFs, or rejected PDFs.
- Anonymous `approved_proposals` returns only approved + verified + valid rows and contains no email, private note, evidence URL, R2 key, reviewer ID, or moderation reason.
- A cannot read/update B's profile, links, claim, proposal, file metadata, or signed PDF URL through REST, RPC, or Next.js routes.
- A direct authenticated call to `attach_proposal_file` and `submit_my_proposal` receives permission denied; only the service role can execute them.
- Two distinct years can be claimed. Race two third-claim requests concurrently; exactly zero third claims should commit. Duplicate year and duplicate verified slot are rejected.
- Rejecting an unverified claim releases capacity. Withdrawing a verified proposal does not. Reopening a rejected claim rechecks capacity and year uniqueness.
- M cannot moderate M's own proposal. M cannot approve without verified claim, current valid PDF, and consent. Every moderation/role action appears in the immutable event history.
- A cross-origin mutation is rejected. `//evil.example`, absolute, and backslash OAuth `next` inputs land on `/account` at the canonical domain.
- Presigned upload expires in ten minutes, works only for its exact key and `application/pdf`, and fails from an unapproved origin.
- Reject `.docx`, MIME spoofing, bad `%PDF-` signature, malformed/encrypted/unparseable PDF, zero pages, interrupted body, and files over 10 MiB. Confirm failed uploads never create a valid database file.
- Replacement keeps the old object/current file until the new object and DB transaction succeed. Draft deletion removes all versions. Abandoned `quarantine/` objects expire after the lifecycle window.
- Reopening an approved proposal removes it immediately from API results, page access, PDF access, avatar access, and the next generated sitemap.
- Profile visibility combinations mask avatar, bio, and individual links independently. Email never appears in public API, HTML, JSON-LD, sitemap, logs, or error responses.
- Keyboard-only wizard/moderation navigation, mobile layout, focus, labels, status announcements, upload retry, and PDF fallback link work.

For database inspection, run:

```powershell
npx supabase db lint --linked --level warning
npx supabase gen types typescript --linked > lib/supabase/database.types.ts
```

Also inspect Supabase's Table Editor/API docs as both `anon` and authenticated test JWTs. Do not test ownership isolation with the service-role key because it intentionally bypasses RLS.

### 9. Run the final release gate

```powershell
npm ci
npm run validate
npm run security:audit
git diff --check
```

`npm run validate` runs lint, type-check, unit/contract tests, catalog dry-run, and the production build. Deploy to a preview using the exact production integration settings, repeat the staging checklist, then smoke-test:

```text
/
/blog
/blog/rss.xml
/blog/post/<published-slug>
/blog/post/<published-slug>.md
/sitemap.xml
/api/v1/health
/api/v2/years
/proposals
/login
/account
/admin/proposals
```

Check response headers on account/admin APIs and signed-URL redirect routes. Confirm production logs do not include request bodies, cookies, access tokens, private notes, evidence URLs, service errors, or signed URLs.

### 10. Monitoring, incident response, and rollback

- Alert on spikes in 401/403/409/422/429/5xx, OAuth callback failures, R2 upload validation failures, moderation actions, and service-role errors.
- Review moderator/admin membership and R2 token scope quarterly.
- Rotate R2, service-role, Google secret, and legacy `ADMIN_KEY` after staff changes or suspected exposure.
- A service-role compromise is a full database incident because that credential bypasses RLS. Revoke it, rotate dependent deployments, review audit/log data, and invalidate active sessions as appropriate.
- Roll back application traffic before altering data. Keep the Mongo snapshot read-only; do not resume dual writes without a rehearsed reconciliation procedure.
- Preserve `private.moderation_events` and deployment audit records according to the privacy/retention policy.

## Residual risks and accepted limitations

- v1 validates PDF type, signature, parseability, size, and delivery behavior but does not run a malware scanner. The preview is sandboxed and responses are forced to PDF with `nosniff`; this reduces risk but is not malware detection. Consider a self-hosted scanner before expanding accepted file types or serving attachments.
- R2 validation downloads up to 10 MiB into server memory for structural parsing and hashing. Rate limits and the hard cap bound this cost; monitor memory and latency.
- Fixed-window user limits do not prevent distributed anonymous traffic against public catalog endpoints. Apply CDN/WAF rate limiting if telemetry shows abuse.
- Identity matching remains a human judgment. Archive-name equality alone is not proof; moderators must inspect private evidence and archived profiles.
- The checked-in database type file is a reviewable contract, but the linked-project generated type file becomes authoritative after migration. Any unexpected generated diff blocks release.
- No external penetration test was performed. For a public launch handling private identity evidence, an independent review is recommended.

## Reviewer checklist

- [ ] Final migrations applied to a clean staging project and `db lint` passes.
- [ ] Generated database types reviewed and committed.
- [ ] Google OAuth first login, callback, refresh, sign-out, and malicious `next` cases pass.
- [ ] RLS matrix passes with anon, A, B, M, D, and service-role clients.
- [ ] Concurrent two-claim cap and all moderation state transitions pass.
- [ ] R2 CORS, presigned PUT/GET, replacement, cleanup, expiry, and malformed PDF cases pass.
- [ ] Public response/email-leak search passes.
- [ ] Accessibility and mobile E2E pass.
- [ ] `npm run validate`, `npm run security:audit`, and production smoke tests pass.
- [ ] Backups, rollback owner, monitoring owner, and key-rotation owner are documented.
