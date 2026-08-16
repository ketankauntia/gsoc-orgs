/**
 * End-to-end refresh of a GSoC year from Google's authoritative API into the
 * local JSON dataset and then into Supabase.
 *
 * Google's live program API is the authority for organization data; see
 * docs/project/architecture/gsoc-data-ingestion.md in the private repo for the
 * source comparison and the endpoint-lifecycle rules that justify this.
 *
 * Stages:
 *   1. fetch     -- pull organizations from Google, sort, and report drift
 *   2. transform -- merge into new-api-details/organizations/*.json + index/metadata
 *   3. yearly    -- regenerate the year page payload
 *   4. taxonomy  -- regenerate tech/topic aggregates
 *   5. db        -- import the JSON catalog into Supabase
 *
 * The db stage runs as a dry run unless --commit is passed, so the default
 * invocation is safe: it shows what would be written without touching Supabase.
 *
 * Usage:
 *   npx tsx scripts/refresh-year.ts --year 2026              # dry run, no DB writes
 *   npx tsx scripts/refresh-year.ts --year 2026 --commit     # writes to Supabase
 *   npx tsx scripts/refresh-year.ts --year 2026 --skip-db    # local JSON only
 *   npx tsx scripts/refresh-year.ts --year 2026 --only fetch # single stage
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);

const flagValue = (flag: string): string | undefined => {
  const i = argv.indexOf(flag);
  return i !== -1 ? argv[i + 1] : undefined;
};

const yearArg = flagValue("--year");
const YEAR = yearArg ? parseInt(yearArg, 10) : new Date().getFullYear();
const COMMIT = argv.includes("--commit");
const SKIP_DB = argv.includes("--skip-db");
const ONLY = flagValue("--only");

if (isNaN(YEAR) || YEAR < 2016 || YEAR > 2100) {
  console.error("Invalid year. Usage: npx tsx scripts/refresh-year.ts --year 2026");
  process.exit(1);
}

type Stage = {
  key: string;
  label: string;
  script: string;
  args: string[];
  /** Skipped stages still print, so a partial run is never silently partial. */
  skip?: () => string | null;
};

const stages: Stage[] = [
  {
    key: "fetch",
    label: "Fetch organizations from Google",
    script: "scripts/fetch-year-data.ts",
    args: ["--year", String(YEAR)],
  },
  {
    key: "transform",
    label: "Transform into per-organization JSON",
    script: "scripts/transform-year-organizations.ts",
    args: ["--year", String(YEAR)],
  },
  {
    key: "yearly",
    label: "Regenerate yearly page payload",
    script: "scripts/generate-yearly-page-from-json.ts",
    args: ["--year", String(YEAR)],
  },
  {
    key: "taxonomy",
    label: "Regenerate technology and topic aggregates",
    script: "scripts/regenerate-tech-topics-from-json.ts",
    args: [],
  },
  {
    key: "db",
    label: COMMIT ? "Import catalog into Supabase (WRITING)" : "Import catalog into Supabase (dry run)",
    script: "scripts/import-supabase-catalog.ts",
    args: COMMIT ? [] : ["--dry-run"],
    skip: () => (SKIP_DB ? "--skip-db was passed" : null),
  },
];

const selected = ONLY ? stages.filter((s) => s.key === ONLY) : stages;
if (ONLY && selected.length === 0) {
  console.error(`Unknown stage "${ONLY}". Valid: ${stages.map((s) => s.key).join(", ")}`);
  process.exit(1);
}

const run = (stage: Stage, index: number): void => {
  const header = `[${index + 1}/${selected.length}] ${stage.label}`;
  console.log(`\n${"=".repeat(header.length)}\n${header}\n${"=".repeat(header.length)}`);

  const skipReason = stage.skip?.();
  if (skipReason) {
    console.log(`[SKIP] ${skipReason}`);
    return;
  }

  const result = spawnSync(
    process.execPath,
    [path.join("node_modules", "tsx", "dist", "cli.mjs"), stage.script, ...stage.args],
    { stdio: "inherit", cwd: process.cwd() },
  );

  if (result.status !== 0) {
    console.error(`\n[FATAL] Stage "${stage.key}" failed with exit code ${result.status}.`);
    console.error("        Nothing downstream was run. Fix the error and re-run;");
    console.error(`        you can resume a single stage with --only ${stage.key}.`);
    process.exit(result.status ?? 1);
  }
};

console.log(`\nGSoC ${YEAR} refresh — source: Google live program API`);
console.log(`Mode: ${SKIP_DB ? "local JSON only" : COMMIT ? "LOCAL + SUPABASE WRITE" : "local JSON + Supabase dry run"}`);

selected.forEach(run);

// Surface the drift report at the end -- it is the part a human must actually read.
const driftFile = path.join(process.cwd(), "new-api-details", "yearly", `${YEAR}-drift-report.json`);
if (fs.existsSync(driftFile)) {
  const drift = JSON.parse(fs.readFileSync(driftFile, "utf-8"));
  console.log(`\n=== Drift summary for ${YEAR} ===`);
  console.log(`  organizations: ${drift.previous_count} -> ${drift.current_count}`);
  console.log(`  added:   ${drift.added.length ? drift.added.join(", ") : "none"}`);
  console.log(`  removed: ${drift.removed.length ? drift.removed.join(", ") : "none"}`);
  console.log(`  changed: ${drift.changed.length} organizations`);
  if (drift.removed.length) {
    console.log(
      "\n  NOTE: removed organizations are marked is_currently_active=false by the\n" +
        "        transform stage; their historical records are retained.",
    );
  }
}

console.log("\nRefresh complete.");
if (!COMMIT && !SKIP_DB) {
  console.log("No database writes were made. Re-run with --commit to write to Supabase.");
}
