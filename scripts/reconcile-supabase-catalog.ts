import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase service-role environment variables are required");
const supabase = createClient(url, key, { auth: { persistSession: false } });
const projectDirectory = path.join(process.cwd(), "new-api-details", "projects");
const projectFiles = fs.readdirSync(projectDirectory).filter((file) => /^(201[6-9]|202[0-5])\.json$/.test(file));

async function main() {
const expectedProjects = projectFiles.reduce((total, file) => total + (JSON.parse(fs.readFileSync(path.join(projectDirectory, file), "utf8")).projects?.length ?? 0), 0);
const expectedOrganizations = fs.readdirSync(path.join(process.cwd(), "new-api-details", "organizations")).filter((file) => file.endsWith(".json") && !["index.json", "metadata.json"].includes(file)).length;
const [orgResult, projectResult, contributorResult, orphanResult] = await Promise.all([
  supabase.from("organizations").select("id", { count: "exact", head: true }),
  supabase.from("projects").select("id", { count: "exact", head: true }),
  supabase.from("project_contributors").select("id", { count: "exact", head: true }),
  supabase.from("projects").select("id,organizations!inner(id)", { count: "exact", head: true }),
]);
const errors = [orgResult.error, projectResult.error, contributorResult.error, orphanResult.error].filter(Boolean);
if (errors.length) throw errors[0];
const report = { expected: { organizations: expectedOrganizations, projects: expectedProjects, contributorSlots: expectedProjects }, actual: { organizations: orgResult.count, projects: projectResult.count, contributorSlots: contributorResult.count, projectsWithOrganizations: orphanResult.count } };
console.log(JSON.stringify(report, null, 2));
if (report.actual.organizations !== expectedOrganizations || report.actual.projects !== expectedProjects || report.actual.contributorSlots !== expectedProjects || report.actual.projectsWithOrganizations !== expectedProjects) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
