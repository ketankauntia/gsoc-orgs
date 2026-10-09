# Contributor hub: proposals, progress posts and profiles

Past Google Summer of Code contributors and mentors can claim the archived project they took part in. Once a claim is verified, contributors publish the accepted proposal that got them selected, under CC BY 4.0, so future applicants can learn from real examples. Contributors also link the progress posts they wrote during GSoC.

## Contributor flow

1. Sign in with Google.
2. Claim a project: pick the year, organization and project, then the person in Google's archive you are (the contributor or one of the mentors). Optional private evidence helps the reviewer.
3. An administrator compares the claim with the archive and verifies it. Until then, the claim and its posts are labelled "Not verified".
4. Contributors add progress posts at any time; they appear immediately with the claim's label.
5. After verification, contributors upload the accepted proposal PDF. The server validates it, extracts its text and scans for email addresses and phone numbers.
6. The contributor confirms that this exact file contains no personal details they do not want public (always required when the text cannot be read, for example a scanned PDF).
7. The contributor accepts CC BY 4.0 and publishes. Publishing is final: afterwards only an administrator can replace or remove the file, and the contributor can request removal at any time.

GSoC's eligibility rules are enforced when a claim is made: an account holds at most two contributor claims, never claims both roles in the same year, and cannot claim a contributor role in or after a year it mentored. Administrators can record exceptions for archive records that predate today's rules; each exception is logged with a reason.

## One proposal, one file

Each contributor slot has at most one proposal, and each proposal has exactly one stored file at `proposals/<proposal id>.pdf`. Replacing the PDF overwrites that file; old versions are not kept. A version number in the public link stops caches from serving an older copy, and the audit log keeps the previous file's checksum.

An administrator may upload a proposal for a contributor who has not signed up, after recording the author's permission (basis, note, date and source). When that contributor later signs in and is verified, they can replace or delete it until they publish their own final copy.

## Architecture

- **Neon Auth** (managed Better Auth) handles Google sign-in. `proxy.ts` refreshes sessions, completes sign-in on `/auth/complete`, and sends signed-out visitors of `/account` and `/admin` to `/login`.
- **Neon Postgres** stores the catalog and the contributor hub: `profiles`, `participations` (claims), `proposals`, `posts` and `private.audit_log`. Only the Next.js server connects to it.
- **Database functions** perform every write. They check ownership, claim limits, the year rules and the proposal lifecycle, so the rules hold however an API is called.
- **Public views** (`public_people`, `public_proposals`, `public_posts`, `public_profiles`) list exactly what may be public. They never include email, evidence, notes, extracted text, storage keys or the audit log.
- **Cloudflare R2** stores proposal PDFs and imported avatars in a private bucket behind **a Cloudflare Worker gateway** that accepts only short-lived HMAC-signed operations on narrowly allowed paths. The browser never receives a bucket credential.
- **Administrators** are listed by user id in `ADMIN_USER_IDS`. Route handlers check it before calling the admin functions; there is no role table.

## PDF storage and validation

Uploads use a short-lived signed `PUT` to a quarantine key, `quarantine/<proposal id>/<random id>.pdf`. When the upload is reported complete, the server verifies:

- `application/pdf` metadata and a maximum size of 10 MiB;
- the `%PDF-` signature, successful parsing and at least one page; and
- a SHA-256 digest and stable byte length.

It then extracts the text and scans it, records the file (which takes the proposal out of public view), copies the bytes onto `proposals/<proposal id>.pdf`, and deletes the quarantine copy. Abandoned quarantine uploads expire automatically. Every PDF request re-checks visibility before a short-lived signed URL is issued, so a removed proposal or a suspended account stops resolving at once.

## Public and protected APIs

Public catalog, proposal and post reads live under `/api/v2`. Account routes use `/api/v2/me` and admin routes use `/api/v2/admin`; both return private, non-cacheable responses, check the session on the server, and reject cross-site mutations. The older unversioned and `/api/v1` catalog endpoints keep their response shapes for compatibility.

## Local setup

Copy `.env.example` to `.env.local` and set the Neon database and auth values (use a development branch), the R2 gateway values and `ADMIN_USER_IDS`. Never commit `.env.local`, OAuth client files, signing secrets, database exports or signed URLs.

```bash
npm run db:migrate
npm run db:import-catalog:dry-run
npm run db:import-catalog
npm run db:reconcile
```

Deploy and verify the private R2 gateway:

```bash
npm run r2:deploy
npm run r2:verify
```

To become an administrator, sign in once, then add your Neon Auth user id to `ADMIN_USER_IDS`.

Run the complete local gate before opening a pull request:

```bash
npm run validate
npm run security:audit
```

## Privacy and security expectations

- Do not log request bodies, cookies, tokens, signed URLs, claim evidence, private notes, extracted proposal text or raw database errors.
- Do not expose database URLs, the auth cookie secret or the storage signing secret to client code.
- Do not treat archived contributor names as automatic identity proof; verification remains a human decision.
- Do not add analytics that rank or monitor individual contributors; analysis of proposal text is published only as aggregates.
- Preserve the distinction between public profile choices and private account data.
- Report suspected vulnerabilities privately according to [SECURITY.md](../SECURITY.md).

## Key implementation locations

- `db/migrations/0002_contributor_hub.sql`: tables, functions, rules and public views.
- `lib/hub/`: queries, request schemas and the upload pipeline.
- `lib/auth.ts`, `lib/neon-auth/`, `proxy.ts`: sessions, profiles and admin checks.
- `app/api/v2/me/`, `app/api/v2/admin/`: account and admin APIs.
- `components/hub/`: account, claim and admin screens.
- `lib/r2.ts`, `lib/pii.ts`: signed storage, PDF validation, text extraction and the personal-data scan.
- `cloudflare/proposal-storage-worker.ts`: private R2 object gateway.
- `scripts/import-catalog.ts`, `scripts/reconcile-catalog.ts`: catalog import and reconciliation.
- `scripts/verify-r2-gateway.ts`: disposable live storage verification.
