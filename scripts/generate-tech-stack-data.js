/**
 * Generate Tech Stack Page JSON Data
 * 
 * This script queries all organizations and generates:
 * 1. index.json - For /tech-stack index page
 * 2. {slug}.json - One file per technology
 * 
 * Run with: node scripts/generate-tech-stack-data.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const OUTPUT_DIR = path.join(__dirname, '..', 'new-api-details', 'tech-stack');
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

// Tech name normalization map
const TECH_NORMALIZATIONS = {
    'c++': 'cpp',
    'c/c++': 'cpp',
    'c #': 'csharp',
    'c#': 'csharp',
    '.net': 'dotnet',
    'node.js': 'nodejs',
    'node': 'nodejs',
    'react.js': 'react',
    'reactjs': 'react',
    'vue.js': 'vue',
    'vuejs': 'vue',
    'angular.js': 'angular',
    'angularjs': 'angular',
};

function normalizeSlug(techName) {
    const lower = techName.toLowerCase().trim();
    // Check normalization map first
    if (TECH_NORMALIZATIONS[lower]) {
        return TECH_NORMALIZATIONS[lower];
    }
    // Generate slug
    return lower.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function normalizeName(techName) {
    // Capitalize properly
    return techName.trim();
}

async function generateTechStackData() {
    console.log('[START] Generating tech stack data...');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 1. Fetch all organizations with tech data
    console.log('[FETCH] Loading organizations from database...');
    const organizations = await prisma.organizations.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            image_url: true,
            img_r2_url: true,
            logo_r2_url: true,
            category: true,
            technologies: true,
            active_years: true,
            years: true,
            total_projects: true,
            is_currently_active: true,
        },
    });
    console.log(`[FETCH] Loaded ${organizations.length} organizations`);

    // 2. Build tech map with normalized names
    console.log('[PROCESS] Building technology index...');
    const techMap = new Map(); // slug -> { name, orgs, byYear }

    organizations.forEach((org) => {
        (org.technologies || []).forEach((tech) => {
            const slug = normalizeSlug(tech);
            const name = normalizeName(tech);

            if (!techMap.has(slug)) {
                techMap.set(slug, {
                    name: name,
                    slug: slug,
                    orgs: new Map(), // slug -> org data
                    byYear: {}, // year -> { orgCount, projectCount }
                });
            }

            const techData = techMap.get(slug);

            // Add org if not already added
            if (!techData.orgs.has(org.slug)) {
                techData.orgs.set(org.slug, {
                    slug: org.slug,
                    name: org.name,
                    logo_url: org.logo_r2_url || org.img_r2_url || org.image_url,
                    category: org.category || 'Other',
                    total_projects: org.total_projects || 0,
                    is_currently_active: org.is_currently_active || false,
                    active_years: org.active_years || [],
                });
            }

            // Calculate by-year stats
            YEARS.forEach((year) => {
                if (org.active_years && org.active_years.includes(year)) {
                    if (!techData.byYear[year]) {
                        techData.byYear[year] = { orgCount: 0, projectCount: 0 };
                    }
                    techData.byYear[year].orgCount++;

                    // Get project count for this year
                    if (org.years) {
                        const yearKey = `year_${year}`;
                        const yearData = org.years[yearKey];
                        if (yearData && yearData.num_projects) {
                            techData.byYear[year].projectCount += yearData.num_projects;
                        }
                    }
                }
            });
        });
    });

    console.log(`[PROCESS] Found ${techMap.size} unique technologies`);

    // 3. Generate per-tech JSON files
    console.log('[GENERATE] Creating per-technology JSON files...');
    const allTechs = [];
    let generatedCount = 0;

    for (const [slug, techData] of techMap.entries()) {
        const orgsArray = Array.from(techData.orgs.values());
        const totalProjects = orgsArray.reduce((sum, o) => sum + (o.total_projects || 0), 0);

        // Calculate metrics
        const activeYears = Object.keys(techData.byYear).map(Number).filter(y => techData.byYear[y].orgCount > 0);
        const firstYear = activeYears.length > 0 ? Math.min(...activeYears) : 2016;
        const latestYear = activeYears.length > 0 ? Math.max(...activeYears) : 2025;

        const techPageData = {
            slug: slug,
            name: techData.name,
            published_at: new Date().toISOString(),

            metrics: {
                org_count: orgsArray.length,
                project_count: totalProjects,
                avg_projects_per_org: orgsArray.length > 0
                    ? Math.round((totalProjects / orgsArray.length) * 10) / 10
                    : 0,
                first_year_used: firstYear,
                latest_year_used: latestYear,
            },

            organizations: orgsArray.sort((a, b) => b.total_projects - a.total_projects),

            charts: {
                popularity_by_year: YEARS.map((year) => ({
                    year,
                    org_count: techData.byYear[year]?.orgCount || 0,
                    project_count: techData.byYear[year]?.projectCount || 0,
                })),
            },

            meta: {
                version: 1,
                generated_at: new Date().toISOString(),
            },
        };

        // Write file
        const filePath = path.join(OUTPUT_DIR, `${slug}.json`);
        fs.writeFileSync(filePath, JSON.stringify(techPageData, null, 2));
        generatedCount++;

        // Add to summary for index
        allTechs.push({
            name: techData.name,
            slug: slug,
            org_count: orgsArray.length,
            project_count: totalProjects,
        });
    }
    console.log(`[GENERATE] Created ${generatedCount} technology files`);

    // 4. Generate index.json
    console.log('[GENERATE] Creating index.json...');

    // Sort for various charts
    const sortedByOrgs = [...allTechs].sort((a, b) => b.org_count - a.org_count);
    const sortedByProjects = [...allTechs].sort((a, b) => b.project_count - a.project_count);

    // Build popularity by year for top techs
    const popularityByYear = {};
    sortedByOrgs.slice(0, 20).forEach((tech) => {
        const techData = techMap.get(tech.slug);
        popularityByYear[tech.slug] = YEARS.map((year) => ({
            year,
            count: techData.byYear[year]?.orgCount || 0,
        }));
    });

    // Calculate fastest growing (compare 2020 vs 2025)
    const fastestGrowing = allTechs
        .map((tech) => {
            const techData = techMap.get(tech.slug);
            const count2020 = techData.byYear[2020]?.orgCount || 0;
            const count2025 = techData.byYear[2025]?.orgCount || 0;
            const growth = count2020 > 0
                ? ((count2025 - count2020) / count2020) * 100
                : count2025 > 5 ? 500 : 0; // Only show high growth for new significant techs
            return {
                slug: tech.slug,
                name: tech.name,
                growth_pct: Math.round(growth),
                first_year_count: count2020,
                last_year_count: count2025,
            };
        })
        .filter((t) => t.last_year_count >= 3) // Must have at least 3 orgs in 2025
        .sort((a, b) => b.growth_pct - a.growth_pct)
        .slice(0, 10);

    // Most selections (org selections over years)
    const mostSelections = sortedByOrgs.slice(0, 10).map((tech) => {
        const techData = techMap.get(tech.slug);
        return {
            name: tech.name,
            slug: tech.slug,
            total: tech.org_count,
            byYear: YEARS.slice(-6).reverse().map((year) => ({
                year,
                count: techData.byYear[year]?.orgCount || 0,
            })),
        };
    });

    // Most projects
    const mostProjects = sortedByProjects.slice(0, 10).map((tech) => {
        const techData = techMap.get(tech.slug);
        return {
            name: tech.name,
            slug: tech.slug,
            total: tech.project_count,
            byYear: YEARS.slice(-6).reverse().map((year) => ({
                year,
                count: techData.byYear[year]?.projectCount || 0,
            })),
        };
    });

    const indexData = {
        slug: 'tech-stack-index',
        published_at: new Date().toISOString(),

        metrics: {
            total_technologies: allTechs.length,
            total_organizations: organizations.length,
        },

        all_techs: sortedByOrgs, // Pre-sorted by org count

        charts: {
            top_tech_by_orgs: sortedByOrgs.slice(0, 15).map((t) => ({
                label: t.name,
                slug: t.slug,
                value: t.org_count,
            })),
            top_tech_by_projects: sortedByProjects.slice(0, 15).map((t) => ({
                label: t.name,
                slug: t.slug,
                value: t.project_count,
            })),
            popularity_by_year: popularityByYear,
            fastest_growing: fastestGrowing,
            most_selections: mostSelections,
            most_projects: mostProjects,
        },

        meta: {
            version: 1,
            generated_at: new Date().toISOString(),
        },
    };

    const indexPath = path.join(OUTPUT_DIR, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
    console.log('[GENERATE] Created index.json');

    // Summary
    console.log('\n[DONE] Tech stack data generation complete!');
    console.log(`  - Total technologies: ${allTechs.length}`);
    console.log(`  - Total organizations: ${organizations.length}`);
    console.log(`  - Files created: ${generatedCount + 1}`);

    await prisma.$disconnect();
}

// Run
generateTechStackData().catch((error) => {
    console.error('[ERROR]', error);
    process.exit(1);
});
