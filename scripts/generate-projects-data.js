/**
 * Generate Projects Year Page JSON Data
 * 
 * This script reads existing yearly JSON data and generates
 * static JSON files for the /projects/[year] pages.
 * 
 * Run with: node scripts/generate-projects-data.js
 */

const fs = require('fs');
const path = require('path');

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const YEARLY_DIR = path.join(__dirname, '..', 'new-api-details', 'yearly');
const OUTPUT_DIR = path.join(__dirname, '..', 'new-api-details', 'projects');

const missingData = [];

function generateProjectsData() {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const year of YEARS) {
        const yearlyFile = path.join(YEARLY_DIR, `google-summer-of-code-${year}.json`);

        if (!fs.existsSync(yearlyFile)) {
            console.log(`[SKIP] No data for year ${year}`);
            missingData.push(`${year}: Missing yearly JSON file`);
            continue;
        }

        console.log(`[PROCESS] Year ${year}...`);

        const yearlyData = JSON.parse(fs.readFileSync(yearlyFile, 'utf-8'));

        // Create organizations lookup map
        const orgMap = new Map(yearlyData.organizations.map(o => [o.slug, o]));

        // Calculate first-time org projects
        const firstTimeOrgSlugs = new Set(
            yearlyData.organizations.filter(o => o.is_first_time).map(o => o.slug)
        );
        const firstTimeOrgProjects = yearlyData.projects.filter(
            p => firstTimeOrgSlugs.has(p.org_slug)
        ).length;

        // Get first-time orgs with project counts
        const firstTimeOrgs = yearlyData.organizations
            .filter(o => o.is_first_time)
            .map(o => ({
                slug: o.slug,
                name: o.name,
                logo_url: o.logo_url,
                project_count: o.project_count,
                is_first_time: true
            }));

        // Calculate avg tech stack size
        const techStackSizes = yearlyData.projects
            .filter(p => p.tech_stack && p.tech_stack.length > 0 && p.tech_stack[0] !== 'unknown')
            .map(p => p.tech_stack.length);
        const avgTechStackSize = techStackSizes.length > 0
            ? Math.round((techStackSizes.reduce((a, b) => a + b, 0) / techStackSizes.length) * 10) / 10
            : undefined;

        // Top org insight
        const topOrg = yearlyData.charts.orgs_with_most_projects[0];
        const topOrgData = topOrg ? {
            name: topOrg.label,
            slug: topOrg.slug || topOrg.label.toLowerCase().replace(/\s+/g, '-'),
            count: topOrg.value
        } : null;

        // Top tech insight
        const topTech = yearlyData.charts.top_languages[0];
        const topTechPercentage = topTech
            ? Math.round((topTech.value / yearlyData.metrics.total_organizations) * 100)
            : 0;
        const topTechData = topTech ? {
            name: topTech.label,
            percentage: topTechPercentage
        } : null;

        // First-time org percentage
        const firstTimeOrgPercentage = Math.round(
            (yearlyData.metrics.first_time_organizations / yearlyData.metrics.total_organizations) * 100
        );

        // Difficulty summary
        let difficultySummary = undefined;
        if (yearlyData.charts.project_difficulty_distribution) {
            const dist = yearlyData.charts.project_difficulty_distribution.data;
            const intermediate = dist.find(d => d.label === 'Intermediate');
            if (intermediate && intermediate.percentage) {
                difficultySummary = `${intermediate.percentage}% of projects are intermediate level`;
            }
        }

        // Transform projects
        const projects = yearlyData.projects.map(p => {
            const org = orgMap.get(p.org_slug);
            return {
                project_id: p.id,
                project_title: p.title,
                contributor: p.contributor || 'Unknown',
                mentors: p.mentors || [],
                org_name: org ? org.name : p.org_slug,
                org_slug: p.org_slug,
                year: year,
                tech_stack: p.tech_stack ? p.tech_stack.filter(t => t !== 'unknown') : [],
            };
        });

        // Add percentages to top technologies
        const topTechnologies = yearlyData.charts.top_languages.slice(0, 15).map(t => ({
            label: t.label,
            slug: t.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            value: t.value,
            percentage: Math.round((t.value / yearlyData.metrics.total_organizations) * 100)
        }));

        // Build output
        const output = {
            year: year,
            slug: `projects-${year}`,
            title: `GSoC ${year} Projects`,
            description: `Complete list of Google Summer of Code ${year} projects with organizations and technology stacks. ${yearlyData.metrics.total_projects} projects across ${yearlyData.metrics.total_organizations} organizations.`,
            published_at: new Date().toISOString(),
            finalized: true,

            metrics: {
                total_projects: yearlyData.metrics.total_projects,
                total_organizations: yearlyData.metrics.total_organizations,
                avg_projects_per_org: Math.round((yearlyData.metrics.total_projects / yearlyData.metrics.total_organizations) * 10) / 10,
                first_time_org_projects: firstTimeOrgProjects,
            },

            projects: projects,
            first_time_orgs: firstTimeOrgs,

            charts: {
                top_technologies: topTechnologies,
                orgs_with_most_projects: yearlyData.charts.orgs_with_most_projects.slice(0, 10),
                project_difficulty_distribution: yearlyData.charts.project_difficulty_distribution,
            },

            insights: {
                top_org: topOrgData,
                top_tech: topTechData,
                first_time_org_percentage: firstTimeOrgPercentage,
                difficulty_summary: difficultySummary,
                avg_tech_stack_size: avgTechStackSize,
            },
        };

        // Write output
        const outputFile = path.join(OUTPUT_DIR, `${year}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
        console.log(`[DONE] Created ${outputFile}`);

        // Track missing data
        const missingTechStack = projects.filter(p => !p.tech_stack || p.tech_stack.length === 0).length;
        if (missingTechStack > 0) {
            missingData.push(`${year}: ${missingTechStack} projects missing tech_stack`);
        }
    }

    // Write missing data log
    const logFile = path.join(OUTPUT_DIR, 'missing-data.log');
    fs.writeFileSync(logFile, missingData.length > 0
        ? missingData.join('\n')
        : 'No missing data detected.');
    console.log(`\n[LOG] Missing data log written to ${logFile}`);
}

// Run
generateProjectsData();
