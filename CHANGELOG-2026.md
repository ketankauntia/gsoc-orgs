# GSoC 2026 Data Integration — Changelog

## Data Pipeline: 4 new scripts

### `scripts/fetch-year-data.ts`
Fetches raw org data from Google's API. Reusable for any year.
```bash
npx tsx scripts/fetch-year-data.ts --year 2026
```
Output: `new-api-details/yearly/google-summer-of-code-2026-organizations-raw.json`

---

### `scripts/transform-year-organizations.ts`
Reads raw API JSON → updates/creates per-org JSON files → regenerates `index.json` + `metadata.json`.

```bash
npx tsx scripts/transform-year-organizations.ts --year 2026
```

What it does for **returning orgs** (156):
```
- adds 2026 to active_years
- updates last_year to 2026
- sets is_currently_active: true
- merges new technologies/topics (union, no deletions)
- updates contact/social from API
```

What it does for **new orgs** (29):
```
- creates new JSON file with first_year: 2026, active_years: [2026]
- maps Google API fields → internal format
```

What it does for **orgs not in 2026** (48):
```
- sets is_currently_active: false (nothing else changed)
```

`first_time` is **derived** in the index, not stored per-org:
```ts
first_time: data.first_year === YEAR
```

---

### `scripts/generate-yearly-page-from-json.ts`
Produces `new-api-details/yearly/google-summer-of-code-2026.json` from org JSON files. No DB.

```bash
npx tsx scripts/generate-yearly-page-from-json.ts --year 2026
```

Output matches `YearlyPageData` type. Projects array is empty (not yet announced). `finalized: false`.

---

### `scripts/regenerate-tech-topics-from-json.ts`
Rebuilds all tech-stack, topics, and homepage JSON from org files. No DB. Years are derived dynamically from the data.

```bash
npx tsx scripts/regenerate-tech-topics-from-json.ts
```

Regenerated:
- 825 tech-stack JSON files + index (all now include 2026 in `popularity_by_year`)
- 1566 topic JSON files + index (all now include 2026 in `yearlyStats`)
- `homepage.json` (updated metrics: 533 total orgs, 185 active)

---

## UI fixes

### `app/organizations/filters-sidebar.tsx`
Added 2026 to the `YEARS` filter array.
```ts
// before
const YEARS = [2025, 2024, ...]
// after
const YEARS = [2026, 2025, 2024, ...]
```

### `app/yearly/page.tsx`
- Added `{ year: 2026, slug: "google-summer-of-code-2026" }` to `yearlyPages`
- Updated stats: "11" years, "11,000+" projects, "2026" latest
- CTA button now links to 2026

### `app/yearly/[slug]/page.tsx`
Added `{ slug: "google-summer-of-code-2026" }` to `generateStaticParams`.

### `lib/projects-page-types.ts`
Added 2026 to `getAvailableProjectYears()`.

### `package.json`
Added npm scripts:
```json
"gsoc:fetch": "npx tsx scripts/fetch-year-data.ts",
"gsoc:transform": "npx tsx scripts/transform-year-organizations.ts",
"gsoc:yearly": "npx tsx scripts/generate-yearly-page-from-json.ts",
"gsoc:regen": "npx tsx scripts/regenerate-tech-topics-from-json.ts",
"gsoc:sync": "... all four in sequence ..."
```

### `.gitignore`
Added `/new-api-details-backup-*/` to ignore backup folders.

---

## Backup

`new-api-details-backup-pre2026/` — full copy of all data before any 2026 changes. Gitignored.

---

## Data summary

| Metric | Value |
|---|---|
| Total orgs in index | 533 (was 504) |
| Active in 2026 | 185 |
| Returning | 156 |
| First-time | 29 |
| Marked inactive | 48 |
| Projects | 0 (not yet announced) |
| Top language | Python (121 orgs) |
| Years covered | 11 (2016–2026) |

---

## Future year workflow

```bash
npm run gsoc:fetch -- --year 2027
npm run gsoc:transform -- --year 2027
npm run gsoc:yearly -- --year 2027
npm run gsoc:regen
```

Then update 3 hardcoded places:
1. `app/yearly/page.tsx` — `yearlyPages` array
2. `app/yearly/[slug]/page.tsx` — `generateStaticParams`
3. `app/organizations/filters-sidebar.tsx` — `YEARS` array

---

## Important: dev server

Next.js caches JSON imports at startup. After running any script that changes JSON files, **restart the dev server** (`Ctrl+C` then `npm run dev`) for changes to appear.
