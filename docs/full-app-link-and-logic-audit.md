# Full application link and logic audit

Last updated: 2026-08-18

## Objective

Audit the shipped application end to end, fix broken internal links and route failures, verify that normalized organizations, technologies, and topics are used consistently, and identify broken external destinations before they affect search quality. The sitemap is intentionally excluded because it will be regenerated and resubmitted after the application fixes are complete.

## Current status

The internal production application is clean. A production build was crawled across every generated organization, technology, topic, yearly archive, and project-detail route.

- 15,108 distinct internal URLs checked
- 15,107 returned HTTP 200
- 1 returned an expected HTTP 307 authentication redirect
- 0 internal 4xx responses
- 0 internal 5xx responses
- 18,503 unique rendered external URLs collected for the external audit
- 18,503/18,503 rendered external destinations verified
- 117 confirmed HTTP 404/410 destinations removed from rendered data
- 128 stored occurrences removed across 87 generated/raw data files, plus one normalized Slack URL with two occurrences

## Root cause

Normalization was present, but it was pipeline-specific rather than an application-wide invariant.

1. Some UI components constructed topic and technology routes directly from human-readable labels. Labels containing spaces, slashes, aliases, or punctuation therefore produced paths that did not match normalized data filenames.
2. Historical project records, especially from 2016 through 2021, retained Google archive organization IDs or old organization slugs instead of the canonical organization slug used by the current organization index.
3. The project-detail route contained mock CPython data instead of resolving the requested archive project.
4. Organization JSON was loaded through a variable dynamic import. The production bundler did not reliably include every possible JSON module, so most unchanged organization pages fell through to the API and returned 500 when Supabase was unavailable.
5. Two organization slugs contained non-ASCII characters. Percent-encoded route parameters and dynamic module resolution did not agree on those filenames.
6. Several public pages assumed the database was reachable even though equivalent static archive data existed or an empty degraded state was acceptable.

The fix enforces canonical identity at data generation, URL construction, route resolution, and production bundling boundaries. It no longer assumes that normalization performed in one layer automatically protects every consumer.

## Implemented fixes

### Technology and topic routing

- Added shared canonical URL helpers for technology and topic routes.
- Updated organization and archive UI links to use those helpers instead of interpolating display labels.
- Canonicalized topic route parameters and canonical metadata URLs.
- Added regression coverage for spaces, encoded separators, aliases, and already-normalized slugs.

### Historical organization identity

- Derived historical aliases from organization archive metadata.
- Added organization alias support, including the historical `weaviate` to `semi-technologies` mapping.
- Added `scripts/normalize-project-organization-identities.ts`.
- Updated `scripts/generate-yearly-page-from-json.ts` so future generated archive data is normalized at the source boundary.
- Normalized 13,756 project records across 2016–2026 to canonical organization slugs.
- Corrected 5,331 inconsistent project organization names.
- Added an exhaustive contract test covering all generated project and yearly documents.

### Organization routes and production bundling

- Converted the two Unicode organization slugs to stable ASCII slugs:
  - `forschungszentrum-jülich` to `forschungszentrum-julich`
  - `institut-für-angewandte-informatik-infai-ev` to `institut-fur-angewandte-informatik-infai-ev`
- Added canonical redirects from the legacy Unicode URLs.
- Added `scripts/normalize-organization-slugs.ts` for repeatable data normalization.
- Replaced the unsafe variable JSON import with a generated lazy-import registry containing all 522 organization documents.
- Added `scripts/generate-organization-imports.ts` and wired it into `prebuild` and `gsoc:sync`, preventing future archive refreshes from omitting organization modules from the production bundle.

### Project details

- Removed the hardcoded mock CPython project page.
- Implemented archive-backed project lookup across all available years.
- Rendered real contributor, mentor, description, source, project, and technology data.
- Added canonical project metadata and normal 404 handling for unknown projects.

### Failure handling and API correctness

- Made `/proposals` and `/contributor-blogs` return usable empty/degraded states when Supabase is unavailable instead of HTTP 500.
- Added static archive facet fallback for proposal search.
- Made invalid yearly archive slugs return 404 rather than trying to load unrelated JSON documents.
- Improved API error extraction so structured API errors do not become `Error("[object Object]")`.
- Replaced placeholder repository URLs in `/api/v1/meta` with `https://github.com/ketankauntia/gsoc-orgs` and its issue tracker.
- Corrected the malformed MetaBrainz social URL to `https://x.com/metabrainz`.

### Security and logical review

- Reviewed authenticated `/api/v2/me/*` endpoints for user and ownership checks.
- Reviewed `/api/v2/admin/*` endpoints for administrator authorization.
- Confirmed mutation routes use trusted-origin checks.
- Confirmed maintenance endpoints require the administrator key.
- Confirmed redirect helpers restrict redirects to safe relative paths or trusted origins.
- Confirmed security headers include content-type sniffing protection, referrer policy, frame protection, permissions policy, and cross-origin opener policy.
- Public database-only v2 APIs return structured 503 responses when the local Supabase instance is unavailable; authentication-protected APIs return 401 as expected.

## Verification evidence

### Automated checks

- Vitest: 13 test files passed, 58 tests passed
- ESLint: passed
- Main TypeScript project: passed
- Cloudflare TypeScript project: passed
- Next.js production build: passed
- Static generation: 1,016 pages generated

### Production route crawl

The repeatable crawler is `scripts/audit-internal-links.ts`. It seeds all archive-backed routes, visits all project-detail URLs, discovers additional rendered internal links, and records non-success responses.

Latest clean result:

```json
{
  "checked": 15108,
  "statuses": {
    "200": 15107,
    "307": 1
  },
  "externalLinks": 18503,
  "failures": []
}
```

The crawler initially found 520 production organization failures. Controlled retesting showed these were real bundling failures rather than bad slugs. The generated import registry fixed them, and the full crawl then completed with no failures.

After removal of the confirmed dead external links, the final production crawl returned the same clean internal result and collected 18,386 external URLs. Comparison against the pre-cleanup set showed zero newly introduced URLs and zero URLs remaining from the 117-entry confirmed-dead inventory.

## External-link audit results and methodology

The completed network audit returned:

```json
{
  "checked": 18503,
  "counts": {
    "blocked_or_rate_limited": 14219,
    "broken": 117,
    "network_error": 143,
    "ok": 4010,
    "other_http_error": 3,
    "server_error": 11
  }
}
```

All 117 confirmed 404/410 destinations were mapped back to their source data. They represented 75 historical project-code link occurrences, 35 social/blog occurrences, 8 contact/contributor-link occurrences, and raw-data duplicates. In total, 128 exact stored occurrences across 87 JSON files were removed. A Slack workspace URL that normalized to a trailing-slash 404 was removed from two additional fields. The dated inventory is `docs/external-link-audit-broken-2026-08-18.json`.

The Internet Archive availability API was tried as a preservation fallback but returned HTTP 429, so no unverifiable archive URLs were substituted. Dead optional links were removed instead of inventing destinations. Blocked, rate-limited, network-error, and 5xx destinations were retained because those results do not prove that a browser-visible link is permanently dead.

The external checker is `scripts/audit-external-links.ts`. It checks the unique URLs rendered by the production application, follows redirects, tries `HEAD` first, retries failed probes with `GET`, and classifies results as:

- `ok`: HTTP 2xx or 3xx
- `broken`: HTTP 404 or 410
- `blocked_or_rate_limited`: HTTP 401, 403, 405, or 429
- `server_error`: HTTP 5xx
- `network_error`: DNS, TLS, connection, or timeout failure
- `other_http_error`: other HTTP failures

Only confirmed 404/410 responses should be treated as broken automatically. A blocked, rate-limited, timed-out, or temporarily unavailable server is not sufficient evidence that the user-facing URL is dead. Historical URLs will only be changed when there is a defensible canonical replacement.

## Remaining work

1. Perform interactive browser journeys if a browser runtime becomes available.
2. Regenerate and resubmit the sitemap separately after the application changes are finalized.
3. Commit, push, deploy, and run the production smoke matrix when publication is authorized.

## Known limitations and blockers

- The in-app browser-control runtime reported no available browser instance. HTTP-level production crawling is exhaustive, but visual layout and click-driven browser journeys have not been performed.
- External sites may block automated requests or become temporarily unavailable. Those results require classification and cannot safely be mass-rewritten.
- The current changes are local and have not been committed or pushed.

## Files and safeguards added

- `scripts/audit-internal-links.ts`
- `scripts/audit-external-links.ts`
- `scripts/generate-organization-imports.ts`
- `scripts/normalize-organization-slugs.ts`
- `scripts/normalize-project-organization-identities.ts`
- `lib/generated/organization-imports.ts`
- `tests/project-organization-links.test.ts`

The code and data audit is complete locally. Publication and browser-based visual acceptance remain separate follow-up actions.
