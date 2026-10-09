/**
 * Verify a year's organization data landed in the database and agrees with the
 * raw Google snapshot on disk.
 *
 * Read-only: issues SELECTs and counts, writes nothing.
 *
 * Usage:
 *   npx tsx scripts/verify-year-import.ts --year 2026
 */

import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { scriptDb } from "./lib/db";
import { SLUG_ALIASES, normalizeOrgName } from "./lib/org-slug-aliases";
import { withdrawnSlugsForYear, type WithdrawalLedger } from "../lib/withdrawals";

const argv = process.argv.slice(2);
const yearIdx = argv.indexOf("--year");
const YEAR = yearIdx !== -1 && argv[yearIdx + 1] ? parseInt(argv[yearIdx + 1], 10) : new Date().getFullYear();
const sql = scriptDb();

async function main() {
  const rawFile = path.join(
    process.cwd(),
    "new-api-details",
    "yearly",
    `google-summer-of-code-${YEAR}-organizations-raw.json`,
  );
  const raw: { slug: string; name: string; description?: string; logo_url?: string }[] =
    JSON.parse(fs.readFileSync(rawFile, "utf-8"));

  const orgs = (await sql`
    select id, slug::text as slug, name, active_years, is_currently_active, description, image_url from public.organizations
  `) as Array<{
    id: string;
    slug: string;
    name: string;
    active_years: number[] | null;
    is_currently_active: boolean | null;
    description: string | null;
    image_url: string | null;
  }>;
  const ledger: WithdrawalLedger = JSON.parse(fs.readFileSync(path.join(process.cwd(), "new-api-details", "withdrawals.json"), "utf-8"));
  const expectedWithdrawn = withdrawnSlugsForYear(ledger, YEAR);
  const organizationYears = (await sql`
    select organization_id, selection_status, withdrawn_at from public.organization_years where year = ${YEAR}
  `) as Array<{ organization_id: string; selection_status: string; withdrawn_at: string | null }>;
  const orgById = new Map(orgs.map((org) => [org.id, org.slug]));
  const actualWithdrawn = new Set(
    (organizationYears ?? [])
      .filter((row) => row.selection_status === "withdrawn")
      .map((row) => orgById.get(row.organization_id))
      .filter((slug): slug is string => Boolean(slug)),
  );
  const withdrawalErrors = [
    ...[...expectedWithdrawn].filter((slug) => !actualWithdrawn.has(slug)).map((slug) => `${slug} missing withdrawn status`),
    ...[...actualWithdrawn].filter((slug) => !expectedWithdrawn.has(slug)).map((slug) => `${slug} unexpectedly withdrawn`),
    ...(organizationYears ?? []).filter((row) => row.selection_status === "withdrawn" && !row.withdrawn_at).map((row) => `${orgById.get(row.organization_id) ?? row.organization_id} missing withdrawn_at`),
  ];

  const inYear = orgs.filter((o) => (o.active_years ?? []).includes(YEAR));
  const active = inYear.filter((o) => o.is_currently_active);

  // Google's slugs are NOT stable -- it appends random suffixes (jenkins-wp,
  // django-software-foundation-8o), and transform-year-organizations.ts
  // deliberately remaps those onto our existing slugs by name. Matching on slug
  // alone therefore produces false "missing" rows, so resolve by slug first and
  // fall back to normalized name, exactly as the transform does.
  // Known rebrands additionally need the shared alias map.
  const bySlug = new Map(orgs.map((o) => [o.slug, o]));
  const byName = new Map(orgs.map((o) => [normalizeOrgName(o.name), o]));
  const resolve = (r: { slug: string; name: string }) =>
    bySlug.get(SLUG_ALIASES[r.slug] ?? r.slug) ??
    bySlug.get(r.slug) ??
    byName.get(normalizeOrgName(r.name)) ??
    null;

  const missingFromDb: string[] = [];
  const matchedDbSlugs = new Set<string>();
  const staleFields: string[] = [];

  for (const r of raw) {
    const db = resolve(r);
    if (!db) {
      missingFromDb.push(r.slug);
      continue;
    }
    matchedDbSlugs.add(db.slug);
    if (actualWithdrawn.has(db.slug)) {
      withdrawalErrors.push(`${db.slug} is currently listed by Google but marked withdrawn`);
    }
    if (!(db.active_years ?? []).includes(YEAR)) {
      missingFromDb.push(`${r.slug} (present but missing ${YEAR} in active_years)`);
    }
    if (r.description && db.description !== r.description) {
      staleFields.push(`${db.slug}.description`);
    }
    if (r.logo_url && db.image_url && db.image_url !== r.logo_url) {
      staleFields.push(`${db.slug}.image_url`);
    }
  }

  const notInGoogle = inYear
    .filter((o) => !matchedDbSlugs.has(o.slug))
    .map((o) => o.slug)
    .sort();

  const [{ tech_count: techCount, topic_count: topicCount }] = await sql`
    select (select count(*) from public.organization_technologies)::int as tech_count,
           (select count(*) from public.organization_topics)::int as topic_count`;
  const [lastRun] = await sql`select status, completed_at from public.import_runs order by completed_at desc nulls last limit 1`;

  console.log(`\n=== Database verification for GSoC ${YEAR} ===\n`);
  console.log(`Google raw snapshot            : ${raw.length} orgs`);
  console.log(`DB orgs with ${YEAR} in active_years: ${inYear.length}`);
  console.log(`  of which is_currently_active : ${active.length}`);
  console.log(`Total orgs in DB (all years)   : ${orgs.length}`);
  console.log(`org_technologies links         : ${techCount}`);
  console.log(`org_topics links               : ${topicCount}`);
  console.log(`\nIn Google but missing from DB  : ${missingFromDb.length ? missingFromDb.join(", ") : "none"}`);
  console.log(`In DB for ${YEAR} but not in Google: ${notInGoogle.length ? notInGoogle.join(", ") : "none"}`);
  console.log(`Stale fields vs Google         : ${staleFields.length ? staleFields.slice(0, 10).join(", ") : "none"}`);
  console.log(`Withdrawal status errors       : ${withdrawalErrors.length ? withdrawalErrors.join(", ") : "none"}`);
  console.log(`\nLast import run                : ${lastRun?.status ?? "unknown"} @ ${lastRun?.completed_at ?? "n/a"}`);

  const ok = missingFromDb.length === 0 && staleFields.length === 0 && withdrawalErrors.length === 0;
  console.log(`\n${ok ? "PASS" : "FAIL"}: every organization Google lists for ${YEAR} is present and current in the DB.`);
  if (notInGoogle.length) {
    console.log(
      `NOTE: ${notInGoogle.length} org(s) carry ${YEAR} historically but are no longer listed by Google\n` +
        `      (withdrawn after announcement). They are retained with is_currently_active=false.`,
    );
  }
  process.exitCode = ok ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
