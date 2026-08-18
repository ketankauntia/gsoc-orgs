export interface ChangelogEntry {
  date: string,
  timeStamp: number,
  version: string,
  title: string,
  summary: string,
  prLinks: { link: string, number: string }[],
  changes: {
    type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'perf' | 'test' | 'chore',
    text: string
  }[],

}
const CHANGELOG_ENTRIES_UNSORTED: ChangelogEntry[] = [
  {
    date: "Jul 7, 2026",
    timeStamp: 20260707,
    version: "v1.2.0",
    title: "Editorial Blog Launch",
    summary: "Launched the first-party editorial platform for practical, source-backed GSoC guides alongside the organization catalog.",
    prLinks: [
      { link: "https://github.com/ketankauntia/gsoc-orgs/commit/efcf2a2", number: "efcf2a2" },
    ],
    changes: [
      { type: 'feat', text: 'Added article, category, tag, and author pages with reusable editorial components.' },
      { type: 'feat', text: 'Added RSS, sitemap, search-index, and Markdown representations for published guides.' },
      { type: 'chore', text: 'Kept editorial management routes unavailable in production until their operational controls were ready.' },
    ]
  },
  {
    date: "Jul 22, 2026",
    timeStamp: 20260722,
    version: "v1.3.0",
    title: "Editorial Workflow and Priority Guides",
    summary: "Expanded the blog from its initial launch into a maintained publishing workflow with stronger content quality and visual support.",
    prLinks: [
      { link: "https://github.com/ketankauntia/gsoc-orgs/commit/5681d31", number: "5681d31" },
      { link: "https://github.com/ketankauntia/gsoc-orgs/commit/0f85164", number: "0f85164" },
      { link: "https://github.com/ketankauntia/gsoc-orgs/commit/d0c3181", number: "d0c3181" },
    ],
    changes: [
      { type: 'feat', text: 'Added author management, approved post artwork, and an image-production workflow.' },
      { type: 'docs', text: 'Published the first priority GSoC guides and strengthened reader-focused FAQs.' },
      { type: 'feat', text: 'Connected the editorial section to primary navigation and improved publishing quality checks.' },
    ]
  },
  {
    date: "Aug 12, 2026",
    timeStamp: 20260812,
    version: "v1.4.0",
    title: "Verified Proposal Library",
    summary: "Implemented a privacy-conscious library where past contributors can claim archived projects and publish accepted proposal PDFs after moderation.",
    prLinks: [
      { link: "https://github.com/ketankauntia/gsoc-orgs/commit/c61a397", number: "c61a397" },
    ],
    changes: [
      { type: 'feat', text: 'Added Google-authenticated profiles, contributor claims, proposal uploads, moderation, and role management.' },
      { type: 'feat', text: 'Added public approved-proposal pages and APIs with CC BY 4.0 attribution.' },
      { type: 'fix', text: 'Added ownership-aware RLS, transaction-locked workflow functions, immutable moderation events, and private storage boundaries.' },
      { type: 'docs', text: 'Published the [proposal library architecture and contributor guide](https://github.com/ketankauntia/gsoc-orgs/blob/master/docs/proposal-library.md).' },
    ]
  },
  {
    date: "Aug 15, 2026",
    timeStamp: 20260815,
    version: "v1.4.1",
    title: "Proposal Data and Storage Cutover",
    summary: "Completed the live catalog migration and hardened proposal storage so the new workflow runs on the canonical Supabase dataset and private R2 infrastructure.",
    prLinks: [
      { link: "https://github.com/ketankauntia/gsoc-orgs/commit/bc0dd6f", number: "bc0dd6f" },
      { link: "https://github.com/ketankauntia/gsoc-orgs/commit/295b1ed", number: "295b1ed" },
    ],
    changes: [
      { type: 'feat', text: 'Imported and reconciled the historical organization, project, contributor, mentor, and waitlist datasets in Supabase.' },
      { type: 'refactor', text: 'Replaced long-lived browser-facing storage assumptions with an auditable, short-lived signed R2 Worker gateway.' },
      { type: 'test', text: 'Added live storage verification for signing, CORS, PDF upload, metadata, download, promotion, and cleanup.' },
      { type: 'chore', text: 'Enabled Google OAuth and aligned generated application types with the live database schema.' },
    ]
  },
  {
    date: "Aug 15, 2026",
    timeStamp: 20260815,
    version: "v1.4.2",
    title: "Analytics and Contributor Documentation",
    summary: "Added optional GA4 page-view measurement and rewrote the public project documentation around the shipped architecture and contribution workflow.",
    prLinks: [],
    changes: [
      { type: 'feat', text: 'Added opt-in-by-configuration Google Analytics 4 page views, including client-side route changes.' },
      { type: 'docs', text: 'Reorganized the README around setup, architecture, data boundaries, commands, and contributor workflow.' },
      { type: 'chore', text: 'Aligned CI with the npm lockfile and the master branch, adding type-check, tests, catalog dry-run, and dependency audit steps.' },
    ]
  },
  {
    date: "Aug 17, 2026",
    timeStamp: 20260817,
    version: "v1.5.0",
    title: "Normalized Catalog Taxonomy",
    summary: "Consolidated duplicate technology and topic spellings into canonical catalog entries while preserving every source label as a reviewed alias.",
    prLinks: [],
    changes: [
      { type: 'feat', text: 'Added canonical technology and topic vocabularies, database alias tables, and idempotent consolidation migrations.' },
      { type: 'fix', text: 'Corrected organization filters, AND/OR behavior, catalog counts, analytics, icons, and permanent redirects for retired slugs.' },
      { type: 'refactor', text: 'Regenerated technology and topic pages from normalized organization data without rewriting the raw source payloads.' },
      { type: 'test', text: 'Added collision, alias, migration, filter-logic, import, and hosted-database verification coverage.' },
    ]
  },
  {
    date: "Aug 17, 2026",
    timeStamp: 20260817,
    version: "v1.5.1",
    title: "Searchable Archive and Historical Accuracy",
    summary: "Made every archived GSoC selection searchable, streamlined contributor submissions, and preserved withdrawn organizations without inflating current participation counts.",
    prLinks: [],
    changes: [
      { type: 'feat', text: 'Added public project search by year, organization, technology, and title with dynamic archive totals and paginated results.' },
      { type: 'feat', text: 'Added claim links that preserve the selected project through sign-in and prefill the contributor submission wizard.' },
      { type: 'fix', text: 'Hardened archive caching, input normalization, upload validation, API failure handling, and saved-draft PDF restoration.' },
      { type: 'test', text: 'Added regression coverage for filtering, pagination, empty results, wildcard input, and technology aliases.' },
      { type: 'feat', text: 'Added an append-only withdrawal ledger and per-year selected or withdrawn status across JSON and Supabase.' },
      { type: 'fix', text: 'Separated 185 announced, 183 participating, and 2 withdrawn organizations in yearly pages, APIs, filters, and analytics.' },
      { type: 'feat', text: 'Added clear withdrawn labels and notices without speculating about withdrawal reasons.' },
      { type: 'test', text: 'Added drift, reinstatement, inactive-program, and unstable-slug regression coverage.' },
    ]
  },
  {
    date: "Aug 18, 2026",
    timeStamp: 20260818,
    version: "v1.5.2",
    title: "Curated Proposals and Contributor Progress Blogs",
    summary: "Added a secure administrator workflow for publishing contributor-authorized proposals and a public directory for selected students' project blogs.",
    prLinks: [],
    changes: [
      { type: 'feat', text: 'Added administrator-only proposal imports tied to real archived contributors, with private permission records and validated PDF publication.' },
      { type: 'feat', text: 'Added a curated contributor-blog directory with year and organization filters for following project progress.' },
      { type: 'fix', text: 'Enforced administrator authorization on every content mutation endpoint independently of hidden navigation and UI controls.' },
      { type: 'test', text: 'Added migration, validation, authorization-boundary, and public-projection regression coverage.' },
    ]
  }
];

export const CHANGELOG_ENTRIES = [...CHANGELOG_ENTRIES_UNSORTED].sort(
  (left, right) => right.timeStamp - left.timeStamp || right.version.localeCompare(left.version, undefined, { numeric: true }),
);
