/**
 * Regenerate tech-stack, topics, and homepage JSON from org JSON files.
 * Pure JSON-to-JSON — no DB required.
 *
 * Reads:
 *   new-api-details/organizations/*.json
 *
 * Writes:
 *   new-api-details/tech-stack/index.json + per-tech files
 *   new-api-details/topics/index.json + per-topic files
 *   new-api-details/homepage.json
 *
 * Usage:
 *   npx tsx scripts/regenerate-tech-topics-from-json.ts
 */

import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const ROOT = process.cwd();
const ORGS_DIR = path.join(ROOT, "new-api-details", "organizations");
const TECH_DIR = path.join(ROOT, "new-api-details", "tech-stack");
const TOPICS_DIR = path.join(ROOT, "new-api-details", "topics");
const HOMEPAGE_FILE = path.join(ROOT, "new-api-details", "homepage.json");

// Derive YEARS dynamically from the org data instead of hardcoding
function deriveYears(orgs: OrgData[]): number[] {
  const yearSet = new Set<number>();
  orgs.forEach((o) => (o.active_years || []).forEach((y) => yearSet.add(y)));
  return Array.from(yearSet).sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface OrgData {
  slug: string;
  name: string;
  image_url: string;
  img_r2_url: string;
  logo_r2_url: string | null;
  category: string;
  technologies: string[];
  topics: string[];
  active_years: number[];
  total_projects: number;
  is_currently_active: boolean;
  years: Record<string, { num_projects?: number } | null>;
}

// ---------------------------------------------------------------------------
// Tech name normalization (mirrors generate-tech-stack-data.js)
// ---------------------------------------------------------------------------
const TECH_NORMALIZATIONS: Record<string, string> = {
  "c++": "cpp",
  "c/c++": "cpp",
  "c #": "csharp",
  "c#": "csharp",
  ".net": "dotnet",
  "node.js": "nodejs",
  node: "nodejs",
  "react.js": "react",
  reactjs: "react",
  "vue.js": "vue",
  vuejs: "vue",
  "angular.js": "angular",
  angularjs: "angular",
};

function normalizeSlug(techName: string): string {
  const lower = techName.toLowerCase().trim();
  if (TECH_NORMALIZATIONS[lower]) return TECH_NORMALIZATIONS[lower];
  return lower.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function topicSlug(topicName: string): string {
  return topicName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Load all org JSON files
// ---------------------------------------------------------------------------
function loadAllOrgs(): OrgData[] {
  const files = fs
    .readdirSync(ORGS_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json" && f !== "metadata.json");

  return files.map((f) => JSON.parse(fs.readFileSync(path.join(ORGS_DIR, f), "utf-8")));
}

// ---------------------------------------------------------------------------
// TECH STACK generation
// ---------------------------------------------------------------------------
function generateTechStack(orgs: OrgData[], YEARS: number[]) {
  console.log("\n[TECH] Generating tech-stack data...");

  if (!fs.existsSync(TECH_DIR)) fs.mkdirSync(TECH_DIR, { recursive: true });

  const techMap = new Map<
    string,
    {
      name: string;
      slug: string;
      orgs: Map<string, {
        slug: string;
        name: string;
        logo_url: string;
        category: string;
        total_projects: number;
        is_currently_active: boolean;
        active_years: number[];
      }>;
      byYear: Record<number, { orgCount: number; projectCount: number }>;
    }
  >();

  orgs.forEach((org) => {
    (org.technologies || []).forEach((tech) => {
      const slug = normalizeSlug(tech);
      const name = tech.trim();
      if (!slug) return;

      if (!techMap.has(slug)) {
        techMap.set(slug, { name, slug, orgs: new Map(), byYear: {} });
      }
      const td = techMap.get(slug)!;

      if (!td.orgs.has(org.slug)) {
        td.orgs.set(org.slug, {
          slug: org.slug,
          name: org.name,
          logo_url: org.logo_r2_url || org.img_r2_url || org.image_url,
          category: org.category || "Other",
          total_projects: org.total_projects || 0,
          is_currently_active: org.is_currently_active || false,
          active_years: org.active_years || [],
        });
      }

      YEARS.forEach((year) => {
        if (org.active_years?.includes(year)) {
          if (!td.byYear[year]) td.byYear[year] = { orgCount: 0, projectCount: 0 };
          td.byYear[year].orgCount++;
          const yd = org.years?.[`year_${year}`];
          if (yd && typeof yd === "object" && "num_projects" in yd) {
            td.byYear[year].projectCount += (yd as { num_projects: number }).num_projects || 0;
          }
        }
      });
    });
  });

  console.log(`[TECH] Found ${techMap.size} unique technologies`);

  // Per-tech files + build allTechs summary
  const allTechs: Array<{ name: string; slug: string; org_count: number; project_count: number }> = [];
  let fileCount = 0;

  for (const [slug, td] of techMap.entries()) {
    const orgsArr = Array.from(td.orgs.values());
    const totalProjects = orgsArr.reduce((s, o) => s + (o.total_projects || 0), 0);
    const activeYears = Object.keys(td.byYear).map(Number).filter((y) => td.byYear[y].orgCount > 0);
    const firstYear = activeYears.length > 0 ? Math.min(...activeYears) : YEARS[0];
    const latestYear = activeYears.length > 0 ? Math.max(...activeYears) : YEARS[YEARS.length - 1];

    const techPage = {
      slug,
      name: td.name,
      published_at: new Date().toISOString(),
      metrics: {
        org_count: orgsArr.length,
        project_count: totalProjects,
        avg_projects_per_org: orgsArr.length > 0 ? Math.round((totalProjects / orgsArr.length) * 10) / 10 : 0,
        first_year_used: firstYear,
        latest_year_used: latestYear,
      },
      organizations: orgsArr.sort((a, b) => b.total_projects - a.total_projects),
      charts: {
        popularity_by_year: YEARS.map((year) => ({
          year,
          org_count: td.byYear[year]?.orgCount || 0,
          project_count: td.byYear[year]?.projectCount || 0,
        })),
      },
      meta: { version: 1, generated_at: new Date().toISOString() },
    };

    fs.writeFileSync(path.join(TECH_DIR, `${slug}.json`), JSON.stringify(techPage, null, 2));
    fileCount++;

    allTechs.push({ name: td.name, slug, org_count: orgsArr.length, project_count: totalProjects });
  }

  // Index file
  const sortedByOrgs = [...allTechs].sort((a, b) => b.org_count - a.org_count);
  const sortedByProjects = [...allTechs].sort((a, b) => b.project_count - a.project_count);

  const lastYear = YEARS[YEARS.length - 1];
  const compareYear = YEARS.length >= 6 ? YEARS[YEARS.length - 6] : YEARS[0];

  const popularityByYear: Record<string, Array<{ year: number; count: number }>> = {};
  sortedByOrgs.slice(0, 20).forEach((t) => {
    const td = techMap.get(t.slug)!;
    popularityByYear[t.slug] = YEARS.map((year) => ({
      year,
      count: td.byYear[year]?.orgCount || 0,
    }));
  });

  const fastestGrowing = allTechs
    .map((t) => {
      const td = techMap.get(t.slug)!;
      const countOld = td.byYear[compareYear]?.orgCount || 0;
      const countNew = td.byYear[lastYear]?.orgCount || 0;
      const growth = countOld > 0 ? ((countNew - countOld) / countOld) * 100 : countNew > 5 ? 500 : 0;
      return {
        slug: t.slug,
        name: t.name,
        growth_pct: Math.round(growth),
        first_year_count: countOld,
        last_year_count: countNew,
      };
    })
    .filter((t) => t.last_year_count >= 3)
    .sort((a, b) => b.growth_pct - a.growth_pct)
    .slice(0, 10);

  const recentYears = YEARS.slice(-6).reverse();

  const mostSelections = sortedByOrgs.slice(0, 10).map((t) => {
    const td = techMap.get(t.slug)!;
    return {
      name: t.name,
      slug: t.slug,
      total: t.org_count,
      byYear: recentYears.map((year) => ({ year, count: td.byYear[year]?.orgCount || 0 })),
    };
  });

  const mostProjects = sortedByProjects.slice(0, 10).map((t) => {
    const td = techMap.get(t.slug)!;
    return {
      name: t.name,
      slug: t.slug,
      total: t.project_count,
      byYear: recentYears.map((year) => ({ year, count: td.byYear[year]?.projectCount || 0 })),
    };
  });

  const indexData = {
    slug: "tech-stack-index",
    published_at: new Date().toISOString(),
    metrics: { total_technologies: allTechs.length, total_organizations: orgs.length },
    all_techs: sortedByOrgs,
    charts: {
      top_tech_by_orgs: sortedByOrgs.slice(0, 15).map((t) => ({ label: t.name, slug: t.slug, value: t.org_count })),
      top_tech_by_projects: sortedByProjects.slice(0, 15).map((t) => ({ label: t.name, slug: t.slug, value: t.project_count })),
      popularity_by_year: popularityByYear,
      fastest_growing: fastestGrowing,
      most_selections: mostSelections,
      most_projects: mostProjects,
    },
    meta: { version: 1, generated_at: new Date().toISOString() },
  };

  fs.writeFileSync(path.join(TECH_DIR, "index.json"), JSON.stringify(indexData, null, 2));
  console.log(`[TECH] Written ${fileCount} tech files + index.json`);
}

// ---------------------------------------------------------------------------
// TOPICS generation
// ---------------------------------------------------------------------------
function generateTopics(orgs: OrgData[], YEARS: number[]) {
  console.log("\n[TOPICS] Generating topics data...");

  if (!fs.existsSync(TOPICS_DIR)) fs.mkdirSync(TOPICS_DIR, { recursive: true });

  const topicMap = new Map<
    string,
    {
      name: string;
      slug: string;
      orgs: Map<string, {
        slug: string;
        name: string;
        first_year: number;
        last_year: number;
        total_projects: number;
        is_currently_active: boolean;
        active_years: number[];
      }>;
      byYear: Record<number, { organizationCount: number; projectCount: number }>;
    }
  >();

  orgs.forEach((org) => {
    (org.topics || []).forEach((topic) => {
      const slug = topicSlug(topic);
      if (!slug) return;

      if (!topicMap.has(slug)) {
        topicMap.set(slug, { name: topic.trim(), slug, orgs: new Map(), byYear: {} });
      }
      const td = topicMap.get(slug)!;

      if (!td.orgs.has(org.slug)) {
        const firstYear = org.active_years?.length ? Math.min(...org.active_years) : YEARS[0];
        const lastYear = org.active_years?.length ? Math.max(...org.active_years) : YEARS[YEARS.length - 1];
        td.orgs.set(org.slug, {
          slug: org.slug,
          name: org.name,
          first_year: firstYear,
          last_year: lastYear,
          total_projects: org.total_projects || 0,
          is_currently_active: org.is_currently_active || false,
          active_years: org.active_years || [],
        });
      }

      YEARS.forEach((year) => {
        if (org.active_years?.includes(year)) {
          if (!td.byYear[year]) td.byYear[year] = { organizationCount: 0, projectCount: 0 };
          td.byYear[year].organizationCount++;
          const yd = org.years?.[`year_${year}`];
          if (yd && typeof yd === "object" && "num_projects" in yd) {
            td.byYear[year].projectCount += (yd as { num_projects: number }).num_projects || 0;
          }
        }
      });
    });
  });

  console.log(`[TOPICS] Found ${topicMap.size} unique topics`);

  let fileCount = 0;
  const allTopics: Array<{
    slug: string;
    name: string;
    organizationCount: number;
    projectCount: number;
    years: number[];
  }> = [];

  for (const [slug, td] of topicMap.entries()) {
    const orgsArr = Array.from(td.orgs.values());
    const totalProjects = orgsArr.reduce((s, o) => s + (o.total_projects || 0), 0);
    const activeYears = Object.keys(td.byYear)
      .map(Number)
      .filter((y) => td.byYear[y].organizationCount > 0)
      .sort((a, b) => b - a);

    const yearlyStats: Record<string, { organizationCount: number; projectCount: number }> = {};
    YEARS.forEach((year) => {
      if (td.byYear[year]) {
        yearlyStats[String(year)] = td.byYear[year];
      }
    });

    const topicPage = {
      slug,
      name: td.name,
      published_at: new Date().toISOString(),
      organizationCount: orgsArr.length,
      projectCount: totalProjects,
      years: activeYears,
      organizations: orgsArr.sort((a, b) => b.total_projects - a.total_projects),
      yearlyStats,
      meta: { version: 1, generated_at: new Date().toISOString() },
    };

    fs.writeFileSync(path.join(TOPICS_DIR, `${slug}.json`), JSON.stringify(topicPage, null, 2));
    fileCount++;

    allTopics.push({
      slug,
      name: td.name,
      organizationCount: orgsArr.length,
      projectCount: totalProjects,
      years: activeYears,
    });
  }

  // Index
  const indexData = {
    slug: "topics-index",
    published_at: new Date().toISOString(),
    total: allTopics.length,
    topics: allTopics.sort((a, b) => b.organizationCount - a.organizationCount),
    meta: { version: 1, generated_at: new Date().toISOString() },
  };

  fs.writeFileSync(path.join(TOPICS_DIR, "index.json"), JSON.stringify(indexData, null, 2));
  console.log(`[TOPICS] Written ${fileCount} topic files + index.json`);
}

// ---------------------------------------------------------------------------
// HOMEPAGE generation
// ---------------------------------------------------------------------------
function generateHomepage(orgs: OrgData[]) {
  console.log("\n[HOMEPAGE] Generating homepage snapshot...");

  const activeOrgs = orgs.filter((o) => o.is_currently_active);
  const featuredOrgs = activeOrgs
    .sort((a, b) => (b.total_projects || 0) - (a.total_projects || 0))
    .slice(0, 25)
    .map((org) => ({
      id: (org as unknown as { id: string }).id || org.slug,
      name: org.name,
      slug: org.slug,
      img_r2_url: org.logo_r2_url || org.img_r2_url || org.image_url,
    }));

  const totalProjects = orgs.reduce((s, o) => s + (o.total_projects || 0), 0);

  const homepage = {
    slug: "homepage",
    published_at: new Date().toISOString(),
    featured_organizations: featuredOrgs,
    metrics: {
      total_organizations: orgs.length,
      active_organizations: activeOrgs.length,
      total_projects: totalProjects,
    },
    meta: { version: 1, generated_at: new Date().toISOString() },
  };

  fs.writeFileSync(HOMEPAGE_FILE, JSON.stringify(homepage, null, 2));
  console.log(`[HOMEPAGE] Featured: ${featuredOrgs.length}, Total: ${orgs.length}, Active: ${activeOrgs.length}, Projects: ${totalProjects}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("[START] Regenerating tech-stack, topics, and homepage from org JSON files\n");

  const orgs = loadAllOrgs();
  console.log(`[LOAD] ${orgs.length} organizations loaded`);

  const YEARS = deriveYears(orgs);
  console.log(`[YEARS] ${YEARS.join(", ")}`);

  generateTechStack(orgs, YEARS);
  generateTopics(orgs, YEARS);
  generateHomepage(orgs);

  console.log("\n[DONE] All regeneration complete!");
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
