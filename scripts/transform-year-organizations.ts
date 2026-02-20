/**
 * Transform raw Google GSoC API data into UI-ready JSON files.
 *
 * Reads:
 *   new-api-details/yearly/google-summer-of-code-{year}-organizations-raw.json
 *   new-api-details/organizations/index.json   (existing org index)
 *   new-api-details/organizations/{slug}.json   (existing per-org files)
 *
 * Writes:
 *   new-api-details/organizations/{slug}.json   (updated / new per-org files)
 *   new-api-details/organizations/index.json    (regenerated)
 *   new-api-details/organizations/metadata.json (regenerated)
 *
 * Usage:
 *   npx tsx scripts/transform-year-organizations.ts --year 2026
 *   npx tsx scripts/transform-year-organizations.ts              (defaults to 2026)
 */

import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const yearFlagIdx = args.indexOf("--year");
const YEAR =
  yearFlagIdx !== -1 && args[yearFlagIdx + 1]
    ? parseInt(args[yearFlagIdx + 1], 10)
    : new Date().getFullYear();

if (isNaN(YEAR) || YEAR < 2016 || YEAR > 2100) {
  console.error("Invalid year. Usage: npx tsx scripts/transform-year-organizations.ts --year 2026");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const ROOT = process.cwd();
const ORGS_DIR = path.join(ROOT, "new-api-details", "organizations");
const YEARLY_DIR = path.join(ROOT, "new-api-details", "yearly");
const RAW_FILE = path.join(YEARLY_DIR, `google-summer-of-code-${YEAR}-organizations-raw.json`);
const INDEX_FILE = path.join(ORGS_DIR, "index.json");
const METADATA_FILE = path.join(ORGS_DIR, "metadata.json");

// ---------------------------------------------------------------------------
// Types for raw Google API data
// ---------------------------------------------------------------------------
interface RawOrg {
  name: string;
  slug: string;
  logo_url: string;
  website_url: string;
  tagline: string;
  license: string;
  categories: string[];
  contributor_guidance_url: string;
  description: string;
  tech_tags: string[];
  topic_tags: string[];
  contact_links: Array<{ name: string; value: string }>;
  source_code: string;
  ideas_link: string;
  direct_comm_methods: Array<{ name: string; value: string }>;
  social_comm_methods: Array<{ name: string; value: string }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function findContactField(
  links: Array<{ name: string; value: string }>,
  fieldName: string,
): string | null {
  const entry = links.find((l) => l.name.toLowerCase() === fieldName.toLowerCase());
  return entry?.value || null;
}

function findSocialField(
  socials: Array<{ name: string; value: string }>,
  fieldName: string,
): string | null {
  const entry = socials.find((l) => l.name.toLowerCase() === fieldName.toLowerCase());
  return entry?.value || null;
}

function buildContact(raw: RawOrg) {
  const all = [...(raw.contact_links || []), ...(raw.direct_comm_methods || [])];
  return {
    email: findContactField(all, "email"),
    guide_url: raw.contributor_guidance_url || null,
    ideas_url: raw.ideas_link || null,
    irc_channel: findContactField(all, "irc") || findContactField(all, "chat"),
    mailing_list: findContactField(all, "mailingList") || findContactField(all, "mailinglist"),
  };
}

function buildSocial(raw: RawOrg) {
  const all = [...(raw.social_comm_methods || []), ...(raw.contact_links || [])];
  return {
    blog: findSocialField(all, "blog"),
    discord: findSocialField(all, "discord"),
    facebook: null,
    github: raw.source_code?.includes("github") ? raw.source_code : findSocialField(all, "github"),
    gitlab: raw.source_code?.includes("gitlab") ? raw.source_code : findSocialField(all, "gitlab"),
    instagram: null,
    linkedin: findSocialField(all, "linkedin"),
    mastodon: null,
    medium: null,
    reddit: null,
    slack: findSocialField(all, "slack"),
    stackoverflow: null,
    twitch: null,
    twitter: findSocialField(all, "twitter"),
    youtube: null,
  };
}

function buildEmptyStatsByYear() {
  const obj: Record<string, number | null> = {};
  for (let y = 2016; y <= YEAR; y++) {
    obj[`year_${y}`] = null;
  }
  return obj;
}

function buildEmptyYearsDetail() {
  const obj: Record<string, null> = {};
  for (let y = 2016; y <= YEAR; y++) {
    obj[`year_${y}`] = null;
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n[TRANSFORM] GSoC ${YEAR} organizations\n`);

  // 1. Read raw API data
  if (!fs.existsSync(RAW_FILE)) {
    console.error(`Raw file not found: ${RAW_FILE}`);
    console.error(`Run fetch-year-data.ts first to download the raw data.`);
    process.exit(1);
  }
  const rawOrgs: RawOrg[] = JSON.parse(fs.readFileSync(RAW_FILE, "utf-8"));
  console.log(`[READ] ${rawOrgs.length} organizations from raw API data`);

  // 2. Read existing index & build name→slug map for fuzzy matching
  let existingIndex: {
    organizations: Array<{ slug: string; name: string;[key: string]: unknown }>;
  } = { organizations: [] };
  if (fs.existsSync(INDEX_FILE)) {
    existingIndex = JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));
  }
  const existingSlugs = new Set(existingIndex.organizations.map((o) => o.slug));

  // Build name→slug lookup for matching orgs with changed API slugs
  const nameToSlug = new Map<string, string>();
  for (const org of existingIndex.organizations) {
    nameToSlug.set(org.name.toLowerCase().trim(), org.slug);
  }

  // Manual alias map for known rebrands / renamed orgs.
  // Maps 2026-API-slug → existing slug in our dataset.
  const SLUG_ALIASES: Record<string, string> = {
    "ceph": "ceph-foundation",
    "openms-inc": "openms",
  };

  // Guard: detect duplicate names in existing index (would cause ambiguous matches)
  const nameOccurrences = new Map<string, string[]>();
  for (const org of existingIndex.organizations) {
    const key = org.name.toLowerCase().trim();
    const list = nameOccurrences.get(key) || [];
    list.push(org.slug);
    nameOccurrences.set(key, list);
  }
  const duplicateNames = Array.from(nameOccurrences.entries()).filter(([, slugs]) => slugs.length > 1);
  if (duplicateNames.length > 0) {
    console.warn(`[WARN] ${duplicateNames.length} duplicate org names detected — name matching skipped for these:`);
    for (const [name, slugs] of duplicateNames) {
      console.warn(`  "${name}" → [${slugs.join(", ")}]`);
    }
  }
  const ambiguousNames = new Set(duplicateNames.map(([name]) => name));

  // Resolve each raw org's slug to an existing FILE (alias → exact slug → name match).
  // Only returns a slug if its JSON file actually exists on disk.
  // Logs every non-trivial match for debuggability.
  function resolveExistingSlug(raw: RawOrg, log = false): string | null {
    // 1. Check manual alias first (known rebrands)
    const alias = SLUG_ALIASES[raw.slug];
    if (alias) {
      const f = path.join(ORGS_DIR, `${alias}.json`);
      if (fs.existsSync(f)) {
        if (log) console.log(`  [ALIAS]  "${raw.slug}" → "${alias}" (manual alias)`);
        return alias;
      }
    }
    // 2. Exact slug match
    if (existingSlugs.has(raw.slug)) {
      const f = path.join(ORGS_DIR, `${raw.slug}.json`);
      if (fs.existsSync(f)) return raw.slug;
    }
    // 3. Name-based match (skip if name is ambiguous)
    const normalizedName = raw.name.toLowerCase().trim();
    if (ambiguousNames.has(normalizedName)) {
      if (log) console.warn(`  [SKIP]   "${raw.slug}" name "${raw.name}" matches multiple existing orgs — add to SLUG_ALIASES`);
      return null;
    }
    const byName = nameToSlug.get(normalizedName);
    if (byName) {
      const f = path.join(ORGS_DIR, `${byName}.json`);
      if (fs.existsSync(f)) {
        if (log) console.log(`  [NAME]   "${raw.slug}" → "${byName}" (matched by name "${raw.name}")`);
        return byName;
      }
    }
    return null;
  }

  const rawSlugs = new Set(rawOrgs.map((o) => o.slug));
  // Also track resolved slugs so we don't deactivate name-matched orgs
  const resolvedSlugs = new Set<string>();

  const returningCount = rawOrgs.filter((o) => resolveExistingSlug(o) !== null).length;
  const newCount = rawOrgs.filter((o) => resolveExistingSlug(o) === null).length;
  console.log(`[ANALYSIS] ${returningCount} returning orgs, ${newCount} first-time orgs`);

  // Log all non-trivial matches (alias + name)
  console.log("[MATCHING] Non-trivial slug resolutions:");
  let matchLogCount = 0;
  for (const raw of rawOrgs) {
    const before = raw.slug;
    const resolved = resolveExistingSlug(raw, true);
    if (resolved && resolved !== before) matchLogCount++;
  }
  if (matchLogCount === 0) console.log("  (none — all matched by exact slug)");

  // 3. Process each raw org
  const now = new Date().toISOString();
  let updatedCount = 0;
  let createdCount = 0;

  for (const raw of rawOrgs) {
    const matchedSlug = resolveExistingSlug(raw);
    const orgFile = matchedSlug
      ? path.join(ORGS_DIR, `${matchedSlug}.json`)
      : path.join(ORGS_DIR, `${raw.slug}.json`);
    const isReturning = matchedSlug !== null && fs.existsSync(orgFile);
    if (matchedSlug) resolvedSlugs.add(matchedSlug);

    if (isReturning) {
      // --- UPDATE existing org ---
      const existing = JSON.parse(fs.readFileSync(orgFile, "utf-8"));

      // Add YEAR to active_years if not already present
      if (!existing.active_years.includes(YEAR)) {
        existing.active_years.push(YEAR);
        existing.active_years.sort((a: number, b: number) => a - b);
      }

      existing.last_year = Math.max(existing.last_year || 0, YEAR);
      existing.is_currently_active = true;

      // Refresh description if the new one is more substantial
      if (raw.description && raw.description.length > (existing.description?.length || 0)) {
        existing.description = raw.description;
      }

      // Merge technologies (union, preserving existing)
      const techSet = new Set([...(existing.technologies || [])]);
      (raw.tech_tags || []).forEach((t: string) => techSet.add(t));
      existing.technologies = Array.from(techSet);

      // Merge topics (union, preserving existing)
      const topicSet = new Set([...(existing.topics || [])]);
      (raw.topic_tags || []).forEach((t: string) => topicSet.add(t));
      existing.topics = Array.from(topicSet);

      // Update contact with any new info (don't overwrite non-null with null)
      const newContact = buildContact(raw);
      if (!existing.contact) existing.contact = {};
      for (const [k, v] of Object.entries(newContact)) {
        if (v !== null) {
          (existing.contact as Record<string, unknown>)[k] = v;
        }
      }

      // Update social with any new info
      const newSocial = buildSocial(raw);
      if (!existing.social) existing.social = {};
      for (const [k, v] of Object.entries(newSocial)) {
        if (v !== null) {
          (existing.social as Record<string, unknown>)[k] = v;
        }
      }

      // Ensure stats has entry for new year
      if (existing.stats?.projects_by_year && !(`year_${YEAR}` in existing.stats.projects_by_year)) {
        existing.stats.projects_by_year[`year_${YEAR}`] = null;
      }
      if (existing.stats?.students_by_year && !(`year_${YEAR}` in existing.stats.students_by_year)) {
        existing.stats.students_by_year[`year_${YEAR}`] = null;
      }

      // Ensure years detail has entry for new year
      if (existing.years && !(`year_${YEAR}` in existing.years)) {
        existing.years[`year_${YEAR}`] = null;
      }

      // Update logo if we have a fresh one from Google
      if (raw.logo_url) {
        existing.image_url = raw.logo_url;
      }

      // Update website URL
      if (raw.website_url) {
        existing.url = raw.website_url;
      }

      // Update category (use first category from API)
      if (raw.categories?.length > 0) {
        existing.category = raw.categories[0];
      }

      existing.meta = { version: 1, generated_at: now };

      fs.writeFileSync(orgFile, JSON.stringify(existing, null, 2));
      updatedCount++;
    } else {
      // --- CREATE new org ---
      const newOrg = {
        id: `new_${YEAR}_${raw.slug}`,
        slug: raw.slug,
        name: raw.name,
        category: raw.categories?.[0] || "Other",
        description: raw.description || raw.tagline || "",
        image_url: raw.logo_url || "",
        img_r2_url: "",
        logo_r2_url: null,
        url: raw.website_url || "",
        active_years: [YEAR],
        first_year: YEAR,
        last_year: YEAR,
        is_currently_active: true,
        technologies: raw.tech_tags || [],
        topics: raw.topic_tags || [],
        total_projects: 0,
        stats: {
          avg_projects_per_appeared_year: 0,
          projects_by_year: buildEmptyStatsByYear(),
          students_by_year: buildEmptyStatsByYear(),
          total_students: 0,
        },
        years: buildEmptyYearsDetail(),
        contact: buildContact(raw),
        social: buildSocial(raw),
        meta: { version: 1, generated_at: now },
      };

      fs.writeFileSync(orgFile, JSON.stringify(newOrg, null, 2));
      createdCount++;
    }
  }

  // 4. Mark orgs NOT in this year's list as inactive (only if they were active)
  let deactivatedCount = 0;
  for (const existingOrg of existingIndex.organizations) {
    if (!rawSlugs.has(existingOrg.slug) && !resolvedSlugs.has(existingOrg.slug)) {
      const orgFile = path.join(ORGS_DIR, `${existingOrg.slug}.json`);
      if (fs.existsSync(orgFile)) {
        const org = JSON.parse(fs.readFileSync(orgFile, "utf-8"));
        if (org.is_currently_active === true) {
          org.is_currently_active = false;
          org.meta = { version: 1, generated_at: now };
          fs.writeFileSync(orgFile, JSON.stringify(org, null, 2));
          deactivatedCount++;
        }
      }
    }
  }

  console.log(`[WRITE] ${updatedCount} orgs updated, ${createdCount} orgs created, ${deactivatedCount} orgs marked inactive`);

  // 5. Regenerate index.json
  console.log("[INDEX] Regenerating organizations index...");
  const allOrgFiles = fs.readdirSync(ORGS_DIR).filter(
    (f) => f.endsWith(".json") && f !== "index.json" && f !== "metadata.json",
  );

  const allOrgs = allOrgFiles
    .map((f) => {
      const data = JSON.parse(fs.readFileSync(path.join(ORGS_DIR, f), "utf-8"));
      return {
        id: data.id,
        slug: data.slug,
        name: data.name,
        category: data.category,
        description: data.description,
        image_url: data.image_url,
        img_r2_url: data.img_r2_url,
        logo_r2_url: data.logo_r2_url,
        url: data.url,
        active_years: data.active_years,
        first_year: data.first_year,
        last_year: data.last_year,
        is_currently_active: data.is_currently_active,
        technologies: data.technologies,
        topics: data.topics,
        total_projects: data.total_projects,
        first_time: data.first_year === YEAR,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const indexData = {
    slug: "organizations-index",
    published_at: now,
    total: allOrgs.length,
    organizations: allOrgs,
    meta: { version: 1, generated_at: now },
  };
  fs.writeFileSync(INDEX_FILE, JSON.stringify(indexData, null, 2));
  console.log(`[INDEX] Written with ${allOrgs.length} organizations`);

  // 6. Regenerate metadata.json
  console.log("[METADATA] Regenerating filter metadata...");
  const techCounts = new Map<string, number>();
  const topicCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const yearCounts = new Map<number, number>();

  allOrgs.forEach((org) => {
    (org.technologies || []).forEach((t: string) => {
      techCounts.set(t, (techCounts.get(t) || 0) + 1);
    });
    (org.topics || []).forEach((t: string) => {
      topicCounts.set(t, (topicCounts.get(t) || 0) + 1);
    });
    if (org.category) {
      categoryCounts.set(org.category, (categoryCounts.get(org.category) || 0) + 1);
    }
    (org.active_years || []).forEach((y: number) => {
      yearCounts.set(y, (yearCounts.get(y) || 0) + 1);
    });
  });

  const metadata = {
    slug: "organizations-metadata",
    published_at: now,
    technologies: Array.from(techCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count })),
    topics: Array.from(topicCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count })),
    categories: Array.from(categoryCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count })),
    years: Array.from(yearCounts.entries())
      .sort(([a], [b]) => b - a)
      .map(([year, count]) => ({ year, count })),
    totals: {
      organizations: allOrgs.length,
      technologies: techCounts.size,
      topics: topicCounts.size,
      categories: categoryCounts.size,
      years: yearCounts.size,
    },
    meta: { version: 1, generated_at: now },
  };
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  console.log(`[METADATA] ${metadata.totals.technologies} techs, ${metadata.totals.topics} topics, ${metadata.totals.categories} categories, ${metadata.totals.years} years`);

  // 7. Summary
  console.log("\n[DONE] Transform complete!");
  console.log(`  Total orgs in index: ${allOrgs.length}`);
  console.log(`  Returning orgs updated: ${updatedCount}`);
  console.log(`  New orgs created: ${createdCount}`);
  console.log(`  Orgs deactivated: ${deactivatedCount}`);
  console.log(`  First-time orgs for ${YEAR}: ${newCount}`);
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
