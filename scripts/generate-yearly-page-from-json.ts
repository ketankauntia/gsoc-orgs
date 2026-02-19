/**
 * Generate yearly page JSON from org JSON files (no DB required).
 *
 * Reads:
 *   new-api-details/organizations/{slug}.json
 *   new-api-details/organizations/index.json
 *
 * Writes:
 *   new-api-details/yearly/google-summer-of-code-{year}.json
 *
 * Usage:
 *   npx tsx scripts/generate-yearly-page-from-json.ts --year 2026
 *   npx tsx scripts/generate-yearly-page-from-json.ts              (defaults to 2026)
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
    : 2026;

if (isNaN(YEAR) || YEAR < 2016 || YEAR > 2100) {
  console.error("Invalid year. Usage: npx tsx scripts/generate-yearly-page-from-json.ts --year 2026");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const ROOT = process.cwd();
const ORGS_DIR = path.join(ROOT, "new-api-details", "organizations");
const INDEX_FILE = path.join(ORGS_DIR, "index.json");
const OUTPUT_FILE = path.join(
  ROOT,
  "new-api-details",
  "yearly",
  `google-summer-of-code-${YEAR}.json`,
);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n[YEARLY] Generating yearly page JSON for GSoC ${YEAR}\n`);

  // 1. Load the org index
  if (!fs.existsSync(INDEX_FILE)) {
    console.error("Organizations index.json not found. Run transform-year-organizations.ts first.");
    process.exit(1);
  }
  const index = JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));

  // 2. Filter orgs active in this year
  const yearOrgs = index.organizations.filter(
    (o: { active_years: number[] }) => o.active_years?.includes(YEAR),
  );
  console.log(`[FILTER] ${yearOrgs.length} organizations active in ${YEAR}`);

  // 3. Load full org data for each to get richer info
  interface FullOrg {
    slug: string;
    name: string;
    image_url: string;
    img_r2_url: string;
    logo_r2_url: string | null;
    first_year: number;
    technologies: string[];
    total_projects: number;
    stats: {
      projects_by_year?: Record<string, number | null>;
    };
    years: Record<string, { num_projects?: number } | null>;
  }

  const fullOrgs: FullOrg[] = yearOrgs.map((o: { slug: string }) => {
    const orgFile = path.join(ORGS_DIR, `${o.slug}.json`);
    if (fs.existsSync(orgFile)) {
      return JSON.parse(fs.readFileSync(orgFile, "utf-8"));
    }
    return o;
  });

  // 4. Build organizations snapshot (sorted by project count desc)
  const yearKey = `year_${YEAR}`;
  const processedOrgs = fullOrgs
    .map((org) => {
      let projectCount = 0;
      // Try to get year-specific project count
      if (org.years?.[yearKey] && typeof org.years[yearKey] === "object") {
        projectCount = (org.years[yearKey] as { num_projects?: number })?.num_projects || 0;
      } else if (org.stats?.projects_by_year?.[yearKey]) {
        projectCount = org.stats.projects_by_year[yearKey] as number;
      }

      return {
        slug: org.slug,
        name: org.name,
        logo_url: org.logo_r2_url || org.img_r2_url || org.image_url,
        project_count: projectCount,
        is_first_time: org.first_year === YEAR,
      };
    })
    .sort((a, b) => b.project_count - a.project_count);

  // 5. Compute tech stack aggregation
  const techMap = new Map<string, { orgs: Set<string> }>();
  fullOrgs.forEach((org) => {
    (org.technologies || []).forEach((rawTech: string) => {
      const tech = rawTech.toLowerCase().trim();
      if (!tech) return;
      if (!techMap.has(tech)) {
        techMap.set(tech, { orgs: new Set() });
      }
      techMap.get(tech)!.orgs.add(org.slug);
    });
  });

  const topLanguages = Array.from(techMap.entries())
    .map(([slug, data]) => ({
      label: slug.charAt(0).toUpperCase() + slug.slice(1),
      slug,
      value: data.orgs.size,
      org_count: data.orgs.size,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);

  const techStackList = topLanguages.map((t) => ({
    slug: t.slug,
    name: t.label,
    project_count: t.value,
    org_count: t.org_count,
  }));

  // 6. Compute metrics
  const totalOrgs = yearOrgs.length;
  const totalProjects = processedOrgs.reduce((sum, o) => sum + o.project_count, 0);
  const firstTimeOrgsCount = processedOrgs.filter((o) => o.is_first_time).length;
  const returningOrgsCount = totalOrgs - firstTimeOrgsCount;
  const avgProjects = totalOrgs > 0 ? Number((totalProjects / totalOrgs).toFixed(1)) : 0;

  // 7. Build charts
  const mostStudentSlots = processedOrgs.slice(0, 20).map((o) => ({
    label: o.name,
    slug: o.slug,
    value: o.project_count,
  }));

  const orgsWithMostProjects = [...mostStudentSlots];

  const highestSelectionsByTech = topLanguages.slice(0, 10).map((t) => ({
    label: t.label,
    slug: t.slug,
    value: t.value,
  }));

  const highestSelectionsByOrg = processedOrgs.slice(0, 10).map((o) => ({
    label: o.name,
    slug: o.slug,
    value: o.project_count,
  }));

  // 8. First-time orgs list
  const firstTimeOrgsList = processedOrgs
    .filter((o) => o.is_first_time)
    .map((o) => ({
      slug: o.slug,
      name: o.name,
      logo_url: o.logo_url,
    }));

  // 9. Build final JSON (matches YearlyPageData type exactly)
  const now = new Date().toISOString();
  const finalJson = {
    year: YEAR,
    slug: `google-summer-of-code-${YEAR}`,
    title: `Google Summer of Code ${YEAR}`,
    subtitle: "Organizations, projects, technologies, and participation insights",
    description: `A complete overview of Google Summer of Code ${YEAR} including participating organizations, projects, technology trends, and key statistics.`,
    published_at: now,
    finalized: false,

    metrics: {
      total_organizations: totalOrgs,
      total_projects: totalProjects,
      total_participants: totalProjects,
      total_mentors: 0,
      first_time_organizations: firstTimeOrgsCount,
      returning_organizations: returningOrgsCount,
      countries_participated: null,
      avg_projects_per_org: avgProjects,
      avg_mentors_per_org: 0,
      avg_participants_per_org: avgProjects,
    },

    organizations: processedOrgs,

    projects: [] as Array<{
      id: string;
      title: string;
      org_slug: string;
      tech_stack: string[];
    }>,

    tech_stack: techStackList,

    participants: {
      total: totalProjects,
      by_country: {},
    },

    mentors: {
      total: 0,
    },

    first_time_orgs: firstTimeOrgsList,

    charts: {
      top_languages: topLanguages,
      most_student_slots: mostStudentSlots,
      project_difficulty_distribution: {
        total: totalProjects,
        data: [
          { label: "Beginner", value: 0 },
          { label: "Intermediate", value: totalProjects },
          { label: "Advanced", value: 0 },
        ],
      },
      orgs_with_most_projects: orgsWithMostProjects,
      highest_selections: {
        by_tech_stack: highestSelectionsByTech,
        by_organization: highestSelectionsByOrg,
      },
    },

    meta: {
      version: 1,
      generated_at: now,
      data_source: "json",
      notes: `Generated from org JSON files. Projects not yet available for ${YEAR}.`,
    },
  };

  // 10. Write
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalJson, null, 2));

  console.log(`[WRITE] ${OUTPUT_FILE}`);
  console.log("\n[SUMMARY]");
  console.log(`  Organizations: ${totalOrgs}`);
  console.log(`  First-time: ${firstTimeOrgsCount}`);
  console.log(`  Returning: ${returningOrgsCount}`);
  console.log(`  Projects: ${totalProjects} (will populate later)`);
  console.log(`  Top language: ${topLanguages[0]?.label || "N/A"} (${topLanguages[0]?.value || 0} orgs)`);
  console.log(`  finalized: false (set to true after projects are added)`);
  console.log("\n[DONE]");
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
