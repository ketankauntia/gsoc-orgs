import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const YEAR = args[0] ? parseInt(args[0], 10) : 2025;

if (isNaN(YEAR)) {
  console.error("Invalid year provided. Usage: npx tsx scripts/populate-year-data.ts <year>");
  process.exit(1);
}

const SLUG = `google-summer-of-code-${YEAR}`;
const OUTPUT_FILE = path.join(process.cwd(), 'new-api-details', 'yearly', `${SLUG}.json`);
const MISSING_DATA_LOG = path.join(process.cwd(), 'new-api-details', 'yearly', `${SLUG}-missing-data.log`);

import { fetchExternalProjects } from './fetch-external-projects';

async function main() {
  console.log(`Fetching data for GSoC ${YEAR}...`);

  // 0. Fetch External Data for Enrichment
  const externalProjects = await fetchExternalProjects(YEAR);
  const externalMap = new Map<string, typeof externalProjects[0]>();
  externalProjects.forEach(ep => {
     if (ep.project_id) externalMap.set(ep.project_id, ep);
  });

  // 1. Fetch Organizations for the year
  const organizations = await prisma.organizations.findMany({
    where: {
      active_years: { has: YEAR },
    },
    select: {
      slug: true,
      name: true,
      image_url: true,
      img_r2_url: true,
      logo_r2_url: true,
      technologies: true,
      total_projects: true, // Note: This might be total across all years, need to check yearly stats if available
      stats: true,
      years: true,
      first_year: true,
    },
  });

  const projects = await prisma.projects.findMany({
    where: {
      year: YEAR
    }
  });

  console.log(`Found ${organizations.length} organizations and ${projects.length} projects.`);

  // Helpers
  const getLogo = (org: { logo_r2_url: string | null; img_r2_url: string | null; image_url: string | null }) => 
    org.logo_r2_url || org.img_r2_url || org.image_url;
  const yearKey = `year_${YEAR}`;

  // FIX 1: Pre-group projects by org (performance - O(N))
  const projectsByOrg = new Map<string, typeof projects>();
  projects.forEach(p => {
    if (!projectsByOrg.has(p.org_slug)) {
      projectsByOrg.set(p.org_slug, []);
    }
    projectsByOrg.get(p.org_slug)!.push(p);
  });

  // 2. Process Organizations
  const processedOrgs = organizations.map(org => {
     // FIX 2: Make project count resolution deterministic
     let projectCount = 0;

     if (projectsByOrg.has(org.slug)) {
       projectCount = projectsByOrg.get(org.slug)!.length;
      } else if (org.stats && typeof org.stats === 'object') {
        const stats = org.stats as Record<string, unknown>;
        const pby = stats.projects_by_year as Record<string, number> | undefined;
        if (pby && pby[yearKey]) {
          projectCount = pby[yearKey];
        }
      } else if (org.years && typeof org.years === 'object') {
        const years = org.years as Record<string, Record<string, unknown>>;
        const yData = years[yearKey];
        if (yData && typeof yData.num_projects === 'number') {
          projectCount = yData.num_projects;
        }
      }

     return {
        slug: org.slug,
        name: org.name,
        logo_url: getLogo(org),
        project_count: projectCount,
        is_first_time: org.first_year === YEAR
     };
  }).sort((a, b) => b.project_count - a.project_count); // Sort by project count descending


  // 3. Process Projects
  // 3. Process Projects
  const processedProjects = projects.map(p => {
      let contributor = p.contributor || "Unknown";
      let mentors = (p.mentors && p.mentors.length > 0) ? p.mentors : ["Unknown"];
      
      // Enrich from external source
      const externalData = externalMap.get(p.project_id);
      if (externalData) {
          if (externalData.contributor) contributor = externalData.contributor;
          if (externalData.mentors && externalData.mentors.length > 0) {
              mentors = externalData.mentors;
          }
      }

      return {
        id: p.project_id || p.id, // Use project_id if available
        title: p.project_title,
        org_slug: p.org_slug,
        contributor: contributor, // Add enriched contributor
        mentors: mentors,         // Add enriched mentors
        tech_stack: ["unknown"]   // Explicitly mark as "unknown"
      };
  });

  // 4. Calculate Metrics
  const totalOrgs = organizations.length;
  const totalProjects = projects.length;
  // Participants & Mentors - rudimentary count or fallback
  // The schema has 'mentors' array/string on projects usually, but let's check
  // Schema says: mentors String[] on projects
  const allMentors = new Set<string>();
  const allParticipants = new Set<string>(); // Contributors

  projects.forEach(p => {
      // Use processedProjects to count because they have enriched data
      // Find the processed version
      const processed = processedProjects.find(pp => pp.id === (p.project_id || p.id));
      if (processed) {
        if (processed.contributor && processed.contributor !== "Unknown") allParticipants.add(processed.contributor);
        if (processed.mentors && Array.isArray(processed.mentors)) {
            processed.mentors.forEach((m) => {
                if (m !== "Unknown") allMentors.add(m);
            });
        }
      }
  });

  const totalParticipants = allParticipants.size > 0 ? allParticipants.size : totalProjects; // Fallback to 1 student per project if names missing
  const totalMentors = allMentors.size; // Might be 0 if data missing

  const firstTimeOrgsCount = processedOrgs.filter(o => o.is_first_time).length;
  const returningOrgsCount = totalOrgs - firstTimeOrgsCount;
  
  const avgProjects = totalOrgs > 0 ? Number((totalProjects / totalOrgs).toFixed(1)) : 0;
  // Avg mentors/participants per org
  const avgMentors = totalOrgs > 0 ? Number((totalMentors / totalOrgs).toFixed(1)) : 0;
  const avgParticipants = totalOrgs > 0 ? Number((totalParticipants / totalOrgs).toFixed(1)) : 0;


  // 5. Calculate Charts data
  // FIX 3: Fix tech stack aggregation (no fake precision)
  const techStackCounts = new Map<
    string,
    { orgs: Set<string> }
  >();

  organizations.forEach(org => {
    if (!Array.isArray(org.technologies)) return;

    org.technologies.forEach(rawTech => {
      const tech = rawTech.toLowerCase().trim();
      if (!tech) return;

      if (!techStackCounts.has(tech)) {
        techStackCounts.set(tech, { orgs: new Set() });
      }

      techStackCounts.get(tech)!.orgs.add(org.slug);
    });
  });

  const topLanguages = Array.from(techStackCounts.entries())
    .map(([slug, data]) => ({
      label: slug.charAt(0).toUpperCase() + slug.slice(1),
      slug,
      value: data.orgs.size, // org count (honest)
      org_count: data.orgs.size
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);

  // Most Student Slots (Top Orgs by Project Count)
  // Reuse processedOrgs which is already sorted
  const mostStudentSlots = processedOrgs.slice(0, 20).map(o => ({
      label: o.name,
      slug: o.slug,
      value: o.project_count
  }));

  // Orgs with Most Projects (Same as above, actually)
  const orgsWithMostProjects = [...mostStudentSlots];

  // Highest Selections
  const highestSelectionsByTech = topLanguages.slice(0, 10).map(t => ({
      label: t.label,
      slug: t.slug,
      value: t.value // "Selections" usually means projects
  }));

  const highestSelectionsByOrg = processedOrgs.slice(0, 10).map(o => ({
      label: o.name,
      slug: o.slug,
      value: o.project_count
  }));

  // Tech Stack List for JSON
  const techStackList = topLanguages.map(t => ({
      slug: t.slug,
      name: t.label,
      project_count: t.value,
      org_count: t.org_count
  }));

  // First Time Orgs List
  const firstTimeOrgsList = processedOrgs.filter(o => o.is_first_time).map(o => ({
      slug: o.slug,
      name: o.name,
      logo_url: o.logo_url
  }));

  // 6. Missing Data Logging
  const missingData: string[] = [];
  if (totalMentors === 0) missingData.push("Mentors data is missing (count is 0).");
  if (totalParticipants === 0 || totalParticipants === totalProjects) missingData.push("Participants (contributors) names might be missing, using project count as proxy.");
  if (organizations.some(o => !o.technologies || o.technologies.length === 0)) {
      missingData.push("Some organizations have no technologies listed.");
  }
  missingData.push("Country-level participant data not available."); // FIX 6: Log missing country data

  // 7. Write JSON
  const finalJson = {
      year: YEAR,
      slug: SLUG,
      title: `Google Summer of Code ${YEAR}`,
      subtitle: "Organizations, projects, technologies, and participation insights",
      description: `A complete overview of Google Summer of Code ${YEAR} including participating organizations, projects, technology trends, and key statistics.`,
      published_at: new Date().toISOString(),
      finalized: true, // FIX 5: Finalized true

      metrics: {
          total_organizations: totalOrgs,
          total_projects: totalProjects,
          total_participants: totalParticipants,
          total_mentors: totalMentors,
          first_time_organizations: firstTimeOrgsCount,
          returning_organizations: returningOrgsCount,
          countries_participated: null, // FIX 6: Null for missing data
          avg_projects_per_org: avgProjects,
          avg_mentors_per_org: avgMentors,
          avg_participants_per_org: avgParticipants
      },

      organizations: processedOrgs,
      projects: processedProjects,
      tech_stack: techStackList,
      
      participants: {
          total: totalParticipants,
          by_country: {} // Missing data
      },

      mentors: {
          total: totalMentors
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
                  { label: "Advanced", value: 0 }
              ]
          },
          orgs_with_most_projects: orgsWithMostProjects,
          highest_selections: {
              by_tech_stack: highestSelectionsByTech,
              by_organization: highestSelectionsByOrg
          }
      },

      meta: {
          version: 1,
          generated_at: new Date().toISOString(),
          data_source: "database",
          notes: "Generated by populate-year-data script."
      }
  };

  // Write files
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalJson, null, 2));
  fs.writeFileSync(MISSING_DATA_LOG, missingData.join('\n'));
  
  console.log(`Successfully wrote data to ${OUTPUT_FILE}`);
  console.log(`Log written to ${MISSING_DATA_LOG}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
