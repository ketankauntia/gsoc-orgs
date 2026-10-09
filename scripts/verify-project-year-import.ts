import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { scriptDb } from "./lib/db";

const args = process.argv.slice(2);
const yearIndex = args.indexOf("--year");
const year = Number(yearIndex === -1 ? new Date().getFullYear() : args[yearIndex + 1]);
if (!Number.isInteger(year) || year < 2016 || year > 2100) throw new Error(`Invalid --year: ${year}`);

const projectFile = path.join(process.cwd(), "new-api-details", "projects", `${year}.json`);
if (!fs.existsSync(projectFile)) throw new Error(`Project payload not found: ${projectFile}`);
const expected = JSON.parse(fs.readFileSync(projectFile, "utf8")) as {
  projects: Array<{ mentors?: string[]; project_abstract_short?: string; project_description?: string; project_url?: string; project_code_url?: string | null }>;
  data_completeness?: { mentors?: boolean };
};

const main = async () => {
  const sql = scriptDb();
  const [counts] = await sql`
    select
      count(*)::int as projects,
      (select count(*) from public.project_people pp join public.projects x on x.id = pp.project_id where x.year = ${year} and pp.role = 'contributor')::int as contributors,
      (select count(*) from public.project_people pp join public.projects x on x.id = pp.project_id where x.year = ${year} and pp.role = 'mentor')::int as mentors,
      count(*) filter (where info_html is not null)::int as descriptions,
      count(*) filter (where abstract_short is not null)::int as short_descriptions,
      count(*) filter (where project_url is not null)::int as project_urls,
      count(*) filter (where code_url is not null)::int as code_urls,
      count(*) filter (where source_payload->>'proposal_id' is not null)::int as source_proposal_ids,
      (select coalesce(sum(project_count), 0) from public.organization_years where year = ${year})::int as organization_project_total
    from public.projects where year = ${year}`;

  const expectedProjects = expected.projects.length;
  const actual = {
    projects: counts.projects, contributors: counts.contributors, mentors: counts.mentors, descriptions: counts.descriptions,
    shortDescriptions: counts.short_descriptions, projectUrls: counts.project_urls, codeUrls: counts.code_urls,
    sourceProposalIds: counts.source_proposal_ids, organizationProjectTotal: counts.organization_project_total,
  } as Record<string, number>;
  const required: Record<string, number> = {
    projects: expectedProjects,
    contributors: expectedProjects,
    mentors: expected.projects.reduce((sum, project) => sum + (project.mentors ?? []).filter((name) => name.trim()).length, 0),
    descriptions: expected.projects.filter((project) => project.project_description).length,
    shortDescriptions: expected.projects.filter((project) => project.project_abstract_short).length,
    projectUrls: expected.projects.filter((project) => project.project_url).length,
    sourceProposalIds: expectedProjects,
    organizationProjectTotal: expectedProjects,
  };
  // Work-product links also come from the organization files, so the project file gives a floor.
  const minimumCodeUrls = expected.projects.filter((project) => project.project_code_url).length;
  const mismatches = Object.entries(required).filter(([key, value]) => actual[key] !== value);
  if (actual.codeUrls < minimumCodeUrls) mismatches.push(["codeUrls", minimumCodeUrls]);
  console.log(JSON.stringify({ year, dataCompleteness: expected.data_completeness ?? null, required: { ...required, codeUrlsAtLeast: minimumCodeUrls }, actual, status: mismatches.length ? "FAIL" : "PASS" }, null, 2));
  if (mismatches.length) {
    throw new Error(`Project verification failed: ${mismatches.map(([key, value]) => `${key} expected ${value}, got ${actual[key]}`).join("; ")}`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
