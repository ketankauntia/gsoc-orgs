/**
 * Fetch raw GSoC organization data from Google's API for any year.
 *
 * Google returns organizations in a shuffled order that changes over time, so
 * the array is sorted by slug before writing. Without that, every refresh
 * rewrites the whole file and a real change is impossible to spot in a diff.
 *
 * Before overwriting, the previous snapshot is compared against the new one and
 * a drift report is printed and written to disk. Orgs do get withdrawn
 * mid-program -- the 2026 list went from 185 to 183 this way -- so drift is
 * expected and must be visible rather than silently absorbed.
 *
 * Writes:
 *   new-api-details/yearly/google-summer-of-code-{year}-organizations-raw.json
 *   new-api-details/yearly/{year}-drift-report.json
 *
 * Usage:
 *   npx tsx scripts/fetch-year-data.ts --year 2026
 *   npx tsx scripts/fetch-year-data.ts --year 2027
 *   npx tsx scripts/fetch-year-data.ts               (defaults to current year)
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const yearFlagIdx = args.indexOf("--year");
const YEAR =
  yearFlagIdx !== -1 && args[yearFlagIdx + 1]
    ? parseInt(args[yearFlagIdx + 1], 10)
    : new Date().getFullYear();

if (isNaN(YEAR) || YEAR < 2016 || YEAR > 2100) {
  console.error("Invalid year. Usage: npx tsx scripts/fetch-year-data.ts --year 2026");
  process.exit(1);
}

const fetchYearData = async () => {
  const url = `https://summerofcode.withgoogle.com/api/program/${YEAR}/organizations/`;
  console.log(`[FETCH] GSoC ${YEAR} organizations from ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch GSoC ${YEAR} organizations: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(
      `Unexpected payload for ${YEAR}: expected an array of organizations, got ${typeof data}`,
    );
  }

  type Org = Record<string, unknown> & { slug?: string; name?: string };
  const orgs = data as Org[];

  // Sort by slug so the file is byte-stable across refreshes and diffs mean something.
  const sorted = [...orgs].sort((a, b) =>
    String(a.slug ?? a.name ?? "").localeCompare(String(b.slug ?? b.name ?? "")),
  );

  const outputDir = path.join(process.cwd(), "new-api-details", "yearly");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(
    outputDir,
    `google-summer-of-code-${YEAR}-organizations-raw.json`,
  );

  // --- Drift detection against the previous snapshot -----------------------
  let drift: {
    year: number;
    fetched_at: string;
    previous_count: number | null;
    current_count: number;
    added: string[];
    removed: string[];
    changed: { slug: string; fields: string[] }[];
  } | null = null;

  if (fs.existsSync(outputFile)) {
    try {
      const previous = JSON.parse(fs.readFileSync(outputFile, "utf-8")) as Org[];
      const prevBySlug = new Map(previous.map((o) => [String(o.slug), o]));
      const currBySlug = new Map(sorted.map((o) => [String(o.slug), o]));

      const added = [...currBySlug.keys()].filter((s) => !prevBySlug.has(s)).sort();
      const removed = [...prevBySlug.keys()].filter((s) => !currBySlug.has(s)).sort();

      const changed: { slug: string; fields: string[] }[] = [];
      for (const slug of [...currBySlug.keys()].filter((s) => prevBySlug.has(s)).sort()) {
        const p = prevBySlug.get(slug)!;
        const c = currBySlug.get(slug)!;
        const fields = [...new Set([...Object.keys(p), ...Object.keys(c)])].filter(
          (k) => JSON.stringify(p[k]) !== JSON.stringify(c[k]),
        );
        if (fields.length > 0) changed.push({ slug, fields });
      }

      drift = {
        year: YEAR,
        fetched_at: new Date().toISOString(),
        previous_count: previous.length,
        current_count: sorted.length,
        added,
        removed,
        changed,
      };
    } catch {
      console.warn("[WARN] Previous snapshot unreadable; skipping drift comparison.");
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(sorted, null, 2));
  console.log(`[DONE] Saved ${sorted.length} organizations to ${outputFile}`);

  if (drift) {
    const driftFile = path.join(outputDir, `${YEAR}-drift-report.json`);
    fs.writeFileSync(driftFile, JSON.stringify(drift, null, 2));

    const { previous_count, current_count, added, removed, changed } = drift;
    if (previous_count !== current_count) {
      console.log(`[DRIFT] Organization count: ${previous_count} -> ${current_count}`);
    }
    if (added.length) console.log(`[DRIFT] Added (${added.length}): ${added.join(", ")}`);
    if (removed.length) console.log(`[DRIFT] Removed (${removed.length}): ${removed.join(", ")}`);
    if (changed.length) {
      console.log(`[DRIFT] Content changed (${changed.length} orgs):`);
      for (const c of changed.slice(0, 10)) {
        console.log(`          ${c.slug}: ${c.fields.join(", ")}`);
      }
      if (changed.length > 10) console.log(`          ...and ${changed.length - 10} more`);
    }
    if (!added.length && !removed.length && !changed.length) {
      console.log("[DRIFT] No changes since previous snapshot.");
    }
    console.log(`[DRIFT] Report written to ${driftFile}`);
  }
};

fetchYearData().catch((err) => {
  console.error(`[ERROR] Failed to fetch GSoC ${YEAR} data`);
  console.error(err);
  process.exit(1);
});
