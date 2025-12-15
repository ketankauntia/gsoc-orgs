# gsoc-orgs

An interface for exploring Google Summer of Code organizations, built with Next.js (app router), Tailwind, and Prisma (MongoDB).

## Quick Start
1) Install dependencies
```bash
pnpm install
```
2) Environment
Create `.env.local` and set:
- `DATABASE_URL` – MongoDB connection string

3) Run locally
```bash
pnpm dev
```
App: http://localhost:3000

4) Lint and build
```bash
pnpm lint
pnpm build
```

## Project Structure
- `app/` – Next.js routes and server components
- `components/` – shared UI
- `lib/` – helpers (API wrapper, Prisma client, utils)
- `prisma/` – Prisma schema
- `public/` – static assets
- `.github/` – CI, templates, CODEOWNERS

## Data & API
- Frontend fetches via `apiFetch` → `/api/*` routes (single API surface).
- `/organizations` is dynamic (SSR) and hits the API at request time (needs `DATABASE_URL` in runtime env).
- CI uses a dummy `DATABASE_URL` for forks (`.github/workflows/ci.yml`).

## Contributing
See `CONTRIBUTING.md` for guidelines. PRs only; one logical change per PR; follow existing structure.

## Security
See `SECURITY.md` for how to report vulnerabilities.

## License (Non-Commercial)
Custom non-commercial license in `LICENSE`. Commercial use requires explicit permission; not OSI-approved. Please read before use.
