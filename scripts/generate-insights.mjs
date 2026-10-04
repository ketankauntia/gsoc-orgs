// Builds new-api-details/insights.json: contributor slots and mentor counts per organization
// per program year, plus program totals. The landing page, directory and organization pages
// read it instead of loading 522 organization files per request.
//
//   node scripts/generate-insights.mjs
//
// Slots come from each organization file (the complete source). Mentor names are joined from
// projects/<year>.json by project id (the last segment of the project URL); a year's mentor
// count is recorded only when every project of that year has names.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const data = join(root, "new-api-details");
const read = (path) => JSON.parse(readFileSync(join(data, path), "utf8"));

const FIRST_YEAR = 2016;
const index = read("organizations/index.json");
const lastYear = Math.max(...index.organizations.flatMap((org) => org.active_years));
const YEARS = Array.from({ length: lastYear - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);

// Logos measured once from the R2 images: white marks on transparency need a dark plate,
// and one file is fully transparent (show initials instead).
const LIGHT_LOGOS = new Set(["beam-community", "biogears", "center-for-research-in-open-source-software-cross", "moira", "mono-project", "rizin", "scilab", "vitrivr"]);
const EMPTY_LOGOS = new Set(["academy-software-foundation"]);

const mentorsById = new Map();
const mentorTotals = {};
for (const year of YEARS) {
  try {
    for (const project of read(`projects/${year}.json`).projects ?? []) {
      if (project.project_id && project.mentors?.length) mentorsById.set(project.project_id, project.mentors);
    }
  } catch { /* year not published yet */ }
  try { mentorTotals[year] = read(`yearly/google-summer-of-code-${year}.json`).metrics?.total_mentors ?? null; } catch { mentorTotals[year] = null; }
}

const withdrawn = read("withdrawals.json").events.filter((event) => event.event === "withdrawn");
const organizations = index.organizations.map((summary) => {
  const file = read(`organizations/${summary.slug}.json`);
  const out = new Set(withdrawn.filter((event) => event.slug === summary.slug).map((event) => event.year));
  const slots = [];
  const mentors = [];
  for (const year of YEARS) {
    const projects = out.has(year) ? [] : file.years?.[`year_${year}`]?.projects ?? [];
    const names = new Set();
    let matched = 0;
    for (const project of projects) {
      const id = String(project.project_url ?? "").split("/").filter(Boolean).pop() ?? "";
      const list = mentorsById.get(id);
      if (list) { matched += 1; list.forEach((name) => names.add(name)); }
    }
    slots.push(projects.length);
    mentors.push(projects.length && matched === projects.length ? names.size : null);
  }
  const logo = EMPTY_LOGOS.has(summary.slug) ? null : file.img_r2_url || file.logo_r2_url || summary.img_r2_url || summary.image_url || null;
  return { slug: summary.slug, slots, mentors, logo, ...(LIGHT_LOGOS.has(summary.slug) ? { logoDark: true } : {}) };
});

const programs = YEARS.map((year, i) => ({ year, slots: organizations.reduce((sum, org) => sum + org.slots[i], 0), mentors: mentorTotals[year] }));
writeFileSync(join(data, "insights.json"), `${JSON.stringify({ version: 1, years: YEARS, programs, organizations })}\n`);
console.log(`insights.json: ${organizations.length} organizations, ${programs.reduce((sum, p) => sum + p.slots, 0)} projects, ${YEARS[0]}–${lastYear}`);
