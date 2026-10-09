# Contributing to GSoC Organizations Guide

Thank you for helping improve the project. Keep pull requests focused, explain the user or maintainer problem they solve, and preserve the boundary between public catalog data and private contributor/moderation data.

## Before you start

- Read the root [README](README.md) for architecture, environment variables, scripts, and data boundaries.
- Read [docs/proposal-library.md](docs/proposal-library.md) before touching proposal routes, profiles, claims, moderation, RLS, or storage.
- Read [SECURITY.md](SECURITY.md) before reporting a vulnerability.
- Check existing issues and pull requests before starting duplicate work.
- Ask before changing migrations, authentication providers, storage policy, analytics behavior, or deployment configuration.

## Local workflow

```bash
git clone https://github.com/ketankauntia/gsoc-orgs.git
cd gsoc-orgs
npm ci
Copy-Item .env.example .env.local  # PowerShell
# cp .env.example .env.local       # macOS/Linux
```

Use a disposable Neon branch for schema and account work. Do not use production credentials in a pull request, issue, test fixture, or log.

Create a branch from `master`:

```bash
git checkout -b feat/short-description
# or: fix/short-description, docs/short-description, test/short-description
```

## Where changes belong

- `app/` — pages, layouts, and route handlers.
- `components/` — reusable UI and client interactions.
- `lib/` — server/client boundaries, validation, storage signing, and data helpers.
- `db/migrations/` — forward-only schema, function, view and grant changes.
- `cloudflare/` — the proposal-storage Worker and its R2 configuration only.
- `scripts/` — imports, reconciliation, and disposable verification.
- `docs/` — reviewed public contributor documentation only.

Do not add internal plans, credentials, private context, moderation notes, raw exports, signed URLs, or local `.agents`/`.claude` tooling to this repository.

## Implementation rules

- Keep Neon Postgres as the runtime source of truth, reached only from the server.
- Keep public catalog reads separate from signed-in contributor and admin routes.
- Enforce ownership and workflow transitions in the database functions as well as route handlers; write through those functions, not directly to tables.
- Validate uploaded files before promotion and use the signed Worker gateway; do not add browser-facing bucket credentials.
- Treat public profile fields as explicit choices. Never expose email, evidence, private notes, or moderation history through public APIs.
- Use TypeScript and existing component/data patterns.
- Keep analytics aggregated and disclosed. Do not track proposal contents or build identity-linked contributor profiles.
- Update the public changelog only for shipped, contributor-relevant changes.

## Tests and validation

Run the complete local gate before opening a pull request:

```bash
npm run validate
npm run security:audit
```

The validation command runs:

- ESLint;
- application and Worker TypeScript checks;
- the test suite;
- canonical catalog import dry-run and checksum validation; and
- the production build.

For relevant changes, also run:

```bash
npm run db:reconcile
npm run r2:verify
```

If a test needs Neon, R2, Google sign-in, or another external service, document the disposable environment, inputs, and result in the pull request without including secrets.

## Database and migration changes

1. Add a new numbered file under `db/migrations/`; never edit one that has been applied (the runner refuses changed files).
2. Review function privileges, views, indexes, and rollback implications.
3. Apply it to a disposable Neon branch first with `npm run db:migrate`.
4. Run import dry-run, reconciliation, tests, and security checks.
5. Explain the data migration and release order in the pull request.

Never edit production tables manually to make a test pass, delete import or audit history, or bypass the database functions to silence an error.

## Commit and pull request

Use Conventional Commit subjects:

```text
feat(search): add topic filter
fix(api): handle empty project results
docs(proposals): clarify contributor workflow
test(auth): cover callback rejection
```

Keep one logical change per commit or pull request where practical. Do not add `Co-authored-by`, Codex, Claude, AI-assisted, generated-by, or similar attribution trailers.

Pull requests should include:

- a concise problem statement and implementation summary;
- affected routes, components, migrations, or infrastructure;
- test commands and results;
- screenshots or recordings for meaningful UI changes;
- security/privacy implications;
- required environment or deployment changes; and
- documentation or changelog updates, if applicable.

Push the branch and open a pull request. Do not commit directly to `master`.

## Review checklist

- [ ] The change is limited to the stated problem.
- [ ] No secret, private data, raw export, or local tooling is staged.
- [ ] Public and authenticated data boundaries are preserved.
- [ ] Tests and validation pass.
- [ ] Migration and generated types are included when needed.
- [ ] Public docs and privacy language are accurate.
- [ ] The pull request explains deployment or environment changes.

## Need help?

Open a focused issue for a bug or feature discussion. For security issues, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
