# Public Project Context

This is the public, repository-safe orientation file for contributors and AI agents. It records the current product direction, completed work, known limitations, and the documents that own deeper implementation detail. It intentionally contains only public product context and generalized user-demand findings.

Last updated: **2026-08-12**

## Quick checklist

- [ ] Read this file before changing product, data, SEO, blog, or image behavior.
- [ ] Treat official Google Summer of Code pages as the authority for current rules, dates, eligibility, stipends, and branding.
- [ ] Never promise selection, infer personal acceptance odds, or present missing data as zero.
- [ ] Keep one canonical page per search intent; do not create pages for every keyword variation.
- [ ] Keep `/organizations` as the interactive organization-list owner and use articles for interpretation and decision support.
- [ ] Verify yearly claims against finalized data and label the observation window and method.
- [ ] Preserve the existing Markdown blog format and dashboard round trip.
- [ ] Use one useful, original cover per article; avoid decorative image bloat.
- [ ] Do not use official or simulated Google Summer of Code or Google logos in commercial editorial artwork.
- [ ] Run type checking, linting, tests, and a production build in proportion to the change.
- [ ] Preserve unrelated work in the current dirty worktree.

## Mission and product promise

GSoC Organizations Guide is an independent explorer and editorial resource for people researching Google Summer of Code organizations, projects, technologies, contribution paths, and application preparation.

The product should help readers:

1. discover organizations from current and historical evidence;
2. inspect participation, projects, technologies, topics, and official resources;
3. build a shortlist based on fit rather than unsupported rankings;
4. understand the contribution and application workflow;
5. verify changing program facts at their official source.

Historical participation, project volume, technology tags, or community activity must not be converted into a claim about an individual applicant's probability of selection.

This project is independent and is not affiliated with or endorsed by Google or Google Summer of Code. “Google Summer of Code,” “Summer of Code,” and “GSoC” are used only to refer accurately to the program.

## Current technical state

- Framework: Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS 4.
- Canonical database: Supabase Postgres.
- Public read optimization: generated JSON under `new-api-details/`.
- Authentication and private proposal storage: Supabase Auth plus Cloudflare R2.
- UI: Radix/shadcn-style primitives, Recharts, Framer Motion, Lucide, and Tabler icons.
- Deployment and measurement: Vercel, Vercel Analytics, and Speed Insights.
- Package manager: npm, represented by `package-lock.json`.
- Blog source: Markdown files under `content/posts/`.
- Blog editor: development-only routes under `/dashboard/editor`.

### Proposal library

The proposal library is implemented across `/proposals`, `/account`, and `/admin`. Contributors authenticate with Google through Supabase Auth, claim a finalized 2016–2025 archived contributor slot, upload one current PDF to private Cloudflare R2 storage, and submit it for manual identity verification and moderation. Approved proposals alone enter the public projection, PDF route, structured data, and sitemap.

The implementation references for future contributors and agents are:

- [`docs/features/proposal-library.md`](docs/features/proposal-library.md) for architecture, data model, lifecycle, routes, and operational behavior;
- [`docs/api/v2-proposal-api.md`](docs/api/v2-proposal-api.md) for the v2 request/response contract;
- [`docs/security/proposal-library-security-audit-and-setup.md`](docs/security/proposal-library-security-audit-and-setup.md) for threat model, fixes, production configuration, staging verification, residual risks, and release gates;
- [`supabase/migrations/202608120001_proposal_library.sql`](supabase/migrations/202608120001_proposal_library.sql) for the authoritative schema, RLS, privileges, claim locking, moderation transitions, and audit records.

Do not enable 2026 claims until finalized project and contributor records exist and the claim-year database guard is intentionally advanced. Do not expose service-role or R2 credentials to client code. Treat proxy redirects as convenience only; every protected route and RPC must continue to enforce authorization independently.

## Repository map

```text
app/                  routes, layouts, metadata, and APIs
components/           shared product, blog, editor, and account UI
content/posts/        Markdown article source
docs/                 architecture, API, editorial, security, and feature guidance
lib/                  loaders, domain types, data access, blog, auth, and utilities
new-api-details/      generated organization, project, year, technology, and topic data
public/               public static assets and per-post image folders
scripts/              import, transform, reconciliation, and generation tasks
supabase/             migrations and storage policy configuration
tests/                unit and contract tests
```

## Source-of-truth order

When facts disagree, use this order:

1. official Google Summer of Code documentation and official program data;
2. validated raw yearly snapshots retained by this repository;
3. deterministic generated files under `new-api-details/`;
4. Supabase runtime records;
5. UI copy or editorial prose.

Derived totals must reconcile with their arrays or disclose a different definition. A partial program year must render as unavailable or incomplete, never as a verified zero.

## Product priorities from generalized user-demand research

The useful public conclusions from product and issue-pattern research are:

- Data freshness and correctness are the first priority, especially current-year projects and resource links.
- Organization discovery should support transparent sorting, inclusive and exclusive filters, shareable URL state, and independent filter resets.
- A shortlist workflow should support saved organizations, private notes, side-by-side comparison, and a shareable or exportable view.
- Organization pages should expose verified idea lists, repositories, contribution guides, communication channels, project history, and last-checked dates.
- Technology and topic aliases need canonical normalization; historical organization-level tags must not masquerade as current project-level requirements.
- CSV or JSON export should precede complex document export unless measured usage justifies more.
- AI-assisted matching is useful only when each recommendation cites visible evidence and the underlying data is trustworthy.
- Performance, mobile behavior, accessibility, and crawlable server-rendered links matter more than novelty interactions.
- Trust pages should explain authorship, methodology, provenance, limitations, corrections, and commercial relationships.

The detailed public implementation backlog should be derived from these jobs without identifying or copying another implementation.

## Editorial system completed in this workstream

The repository now contains an agent-ready editorial hierarchy:

- [`docs/editorial/README.md`](docs/editorial/README.md): workflow, quality gate, and navigation.
- [`docs/editorial/research/seo-content-playbook.md`](docs/editorial/research/seo-content-playbook.md): people-first search and writing policy.
- [`docs/editorial/research/gsoc-source-map.md`](docs/editorial/research/gsoc-source-map.md): primary-source routing for program claims.
- [`docs/editorial/research/search-demand-map.md`](docs/editorial/research/search-demand-map.md): qualitative query and intent map.
- [`docs/editorial/strategy/150-post-roadmap.md`](docs/editorial/strategy/150-post-roadmap.md): a research backlog, not permission to mass-publish near-duplicate pages.
- [`docs/editorial/production/batch-01-briefs.md`](docs/editorial/production/batch-01-briefs.md): briefs for the first long-form batch.
- [`docs/blog/content-format.md`](docs/blog/content-format.md): executable Markdown/frontmatter contract.

Fifteen in-depth articles were added for distinct intents:

- `what-is-gsoc`
- `gsoc-eligibility`
- `gsoc-stipend`
- `how-to-apply-for-gsoc`
- `gsoc-preparation-roadmap`
- `how-to-start-open-source-for-gsoc`
- `how-to-contact-gsoc-mentors`
- `how-to-choose-gsoc-project`
- `accepted-gsoc-proposal-examples`
- `gsoc-acceptance-rate-selection-process`
- `ai-in-gsoc`
- `gsoc-community-bonding`
- `gsoc-evaluations-work-product`
- `gsoc-organizations-for-python`
- `gsoc-organizations-for-javascript`

Five other canonical articles already own the 2027 guide, organization-list, organization-choice, proposal-writing, and organization-data-workflow intents. Extend those pages instead of publishing overlapping variants.

### Editorial guardrails

- Google does not prescribe an ideal article length. The current 1,500-word floor is an editorial choice, not a ranking rule.
- Publish information gain: original calculations, transparent methods, useful templates, decision frameworks, or first-party interpretation.
- Do not manufacture experience, quotations, testimonials, statistics, or “easy organization” claims.
- Search synonyms usually belong on one canonical page.
- Update annually changing facts only after checking current official documentation.
- The current historical editorial analysis uses finalized 2016–2025 local snapshots and excludes incomplete 2026 project totals.
- Historical technology-profile tags are discovery signals, not proof that every listed organization used that technology in a specific year's projects.

## Editorial image system completed in this workstream

Research and implementation established a restrained cover-art system:

- [`docs/editorial/images/README.md`](docs/editorial/images/README.md): workflow and release gate.
- [`docs/editorial/images/image-seo-playbook.md`](docs/editorial/images/image-seo-playbook.md): branding, accessibility, performance, metadata, and provenance guidance.
- Visible cover convention: `public/blog/<slug>/<slug>-cover.webp`, 1600×900.
- Social-image convention: `public/blog/<slug>/<slug>-social.jpg`, 1200×630.
- One original, text-free, 16:9 hero illustration per article for the first batch.
- Additional visuals are justified only when they teach; exact charts, timelines, and decision trees should be accessible HTML, SVG, or chart code backed by verified data.

The shared visual language is deep slate/navy, teal and aqua, off-white, and one restrained warm accent. It uses geometric paper, frosted-glass, and architectural metaphors with one focal idea and generous negative space. Covers must not contain headlines, readable code, logos, trademarked marks, watermarks, or a lookalike Google colour system.

The blog runtime now supports:

- `coverImage` for the visible article/card cover;
- `coverAlt` for contextual article-cover alternative text;
- `ogImage` for the 1200×630 social derivative;
- responsive `next/image` rendering with gradient fallback;
- decorative empty alt text on linked cards whose heading already names the destination;
- article-cover metadata, image dimensions, MIME, large image previews, and structured data;
- preservation and editing of all image fields in the dashboard and draft previews.

### Current image-production status

Five source illustrations were generated and visually reviewed during the session for:

- `what-is-gsoc`
- `gsoc-eligibility`
- `gsoc-stipend`
- `how-to-apply-for-gsoc`
- `gsoc-preparation-roadmap`

They have not yet been copied, cropped, optimized, named, hashed, added to a manifest, or connected to article frontmatter. Generation of the remaining ten covers was interrupted. Do not mark the visual batch complete until all fifteen files are inside the repository, visually reviewed, wired, and validated.

## Known risks and unfinished work

- The 2026 organization snapshot exists, but the local 2026 project dataset is incomplete; zero-derived project metrics are unsafe.
- Technology/topic taxonomy contains sparse pages, aliases, and historical aggregation that need normalization and indexation rules.
- Some homepage claims and outcome-oriented language require a trust review.
- A project-detail route still contains mock records and TODOs.
- CI configuration and the committed npm lockfile/branch assumptions need reconciliation.
- Sitemap modification dates should derive from content/data changes, not every deployment.
- License copy must accurately distinguish a custom non-commercial/source-available license from an OSI-approved open-source license.
- The existing product/domain naming and commercial use of GSoC wording should receive an independent trademark review. Do not expand branding risk through artwork.
- The worktree contains extensive changes from multiple workstreams. Never discard or overwrite unrelated edits.

## Validation record

During the editorial workstream:

- all fifteen new posts parsed through the blog loader;
- assigned SEO checks reported no failures, with expected warnings for posts without body imagery;
- internal article links were checked;
- TypeScript and production build validation passed at the recorded checkpoints;
- the final repository validation resolved the earlier migration-contract assertion and all 16 tests passed.

During the cover-integration workstream:

- TypeScript type checking passed;
- scoped ESLint passed for the changed cover/editor files;
- `git diff --check` found no whitespace errors.

During the final proposal-library and security validation:

- ESLint and TypeScript passed;
- all 16 unit and security-contract tests passed;
- the deterministic Supabase catalog dry-run reconciled 522 organization files, 10,951 projects/contributor slots, and 23,749 mentors;
- the production dependency audit reported zero vulnerabilities;
- the Next.js production build completed and generated 1,036 routes;
- local production smoke tests passed for the homepage, blog, RSS, Markdown route, sitemap, proposal directory, and login;
- live Supabase RLS, Google OAuth, and R2 integration verification remains a mandatory staging release gate because external credentials were not available in the local environment.

Run the full validation suite again after finishing image assets or resolving concurrent worktree changes.

## Agent handoff

For the next image-production pass:

1. read both editorial image documents;
2. create the missing `docs/editorial/images/batch-01-image-manifest.md` before wiring assets;
3. retain the approved independent visual language and per-post concepts;
4. generate the remaining ten covers without marks or text;
5. copy source outputs into a non-public provenance location if desired, then use Sharp to create the two public derivatives;
6. set `coverImage`, `coverAlt`, and `ogImage` in each article's frontmatter;
7. inspect card, article, hero-template, mobile, and dark-mode crops;
8. validate dimensions, MIME, byte size, hashes, metadata, type checking, linting, tests, and production build.

For all other work, start at [`docs/README.md`](docs/README.md) and follow the most specific document for the subsystem being changed.
