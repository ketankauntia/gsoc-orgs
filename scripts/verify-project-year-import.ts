import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const yearIndex = args.indexOf("--year");
const year = Number(yearIndex === -1 ? new Date().getFullYear() : args[yearIndex + 1]);
if (!Number.isInteger(year) || year < 2016 || year > 2100) throw new Error(`Invalid --year: ${year}`);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) throw new Error("Supabase service-role environment variables are required");

const projectFile = path.join(process.cwd(), "new-api-details", "projects", `${year}.json`);
if (!fs.existsSync(projectFile)) throw new Error(`Project payload not found: ${projectFile}`);
const expected = JSON.parse(fs.readFileSync(projectFile, "utf8")) as {
  projects: Array<{ mentors?: string[]; project_abstract_short?: string; project_description?: string; project_url?: string; project_code_url?: string | null }>;
  data_completeness?: { mentors?: boolean };
};

const client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
type CountResult = { count: number | null; error: { message: string } | null };
const resolveCount = async (label: string, query: PromiseLike<CountResult>) => {
  const { count: result, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  return result ?? 0;
};

const main = async () => {
  const expectedProjects = expected.projects.length;
  const expectedMentorSlots = expected.projects.reduce((sum, project) => sum + (project.mentors?.length ?? 0), 0);
  const [projects, contributors, mentors, descriptions, shortDescriptions, projectUrls, codeUrls, sourceProposalIds] = await Promise.all([
    resolveCount("projects", client.from("projects").select("*", { count: "exact", head: true }).eq("year", year)),
    resolveCount("project_contributors", client.from("project_contributors").select("project_id,projects!inner(year)", { count: "exact", head: true }).eq("projects.year", year)),
    resolveCount("project_mentors", client.from("project_mentors").select("project_id,projects!inner(year)", { count: "exact", head: true }).eq("projects.year", year)),
    resolveCount("project descriptions", client.from("projects").select("*", { count: "exact", head: true }).eq("year", year).not("info_html", "is", null)),
    resolveCount("project short descriptions", client.from("projects").select("*", { count: "exact", head: true }).eq("year", year).not("abstract_short", "is", null)),
    resolveCount("project URLs", client.from("projects").select("*", { count: "exact", head: true }).eq("year", year).not("project_url", "is", null)),
    resolveCount("code URLs", client.from("projects").select("*", { count: "exact", head: true }).eq("year", year).not("code_url", "is", null)),
    resolveCount("source proposal IDs", client.from("projects").select("*", { count: "exact", head: true }).eq("year", year).not("source_payload->>proposal_id", "is", null)),
  ]);

  const { data: organizationYears, error: organizationYearsError } = await client
    .from("organization_years")
    .select("project_count")
    .eq("year", year)
    .range(0, 999);
  if (organizationYearsError) throw new Error(`organization_years: ${organizationYearsError.message}`);
  const organizationProjectTotal = (organizationYears ?? []).reduce((sum, row) => sum + row.project_count, 0);

  const actual = { projects, contributors, mentors, descriptions, shortDescriptions, projectUrls, codeUrls, sourceProposalIds, organizationProjectTotal };
  const required = {
    projects: expectedProjects,
    contributors: expectedProjects,
    mentors: expectedMentorSlots,
    descriptions: expected.projects.filter((project) => project.project_description).length,
    shortDescriptions: expected.projects.filter((project) => project.project_abstract_short).length,
    projectUrls: expected.projects.filter((project) => project.project_url).length,
    codeUrls: expected.projects.filter((project) => project.project_code_url).length,
    sourceProposalIds: expectedProjects,
    organizationProjectTotal: expectedProjects,
  };
  const mismatches = Object.entries(required).filter(([key, value]) => actual[key as keyof typeof actual] !== value);
  console.log(JSON.stringify({ year, dataCompleteness: expected.data_completeness ?? null, required, actual, status: mismatches.length ? "FAIL" : "PASS" }, null, 2));
  if (mismatches.length) {
    throw new Error(`Hosted project verification failed: ${mismatches.map(([key, value]) => `${key} expected ${value}, got ${actual[key as keyof typeof actual]}`).join("; ")}`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
