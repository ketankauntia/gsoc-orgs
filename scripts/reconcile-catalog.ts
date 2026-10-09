import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { scriptDb } from "./lib/db";

// Compares database row counts with the checked-in JSON after a catalog import.
// Read-only.

const root = process.cwd();
const projectDirectory = path.join(root, "new-api-details", "projects");
const projects = fs.readdirSync(projectDirectory).filter((file) => /^20\d{2}\.json$/.test(file))
  .flatMap((file) => (JSON.parse(fs.readFileSync(path.join(projectDirectory, file), "utf8")).projects ?? []) as Array<{ mentors?: string[] }>);
const organizationFiles = fs.readdirSync(path.join(root, "new-api-details", "organizations"))
  .filter((file) => file.endsWith(".json") && !["index.json", "metadata.json"].includes(file));

async function main() {
  const sql = scriptDb();
  const [counts] = await sql`
    select (select count(*) from public.organizations)::int as organizations,
           (select count(*) from public.projects)::int as projects,
           (select count(*) from public.project_people where role = 'contributor')::int as contributor_slots,
           (select count(*) from public.project_people where role = 'mentor')::int as mentor_slots,
           (select count(*) from public.projects p where not exists (select 1 from public.project_people pp where pp.project_id = p.id and pp.role = 'contributor'))::int as projects_without_contributor`;
  const expected = {
    organizations: organizationFiles.length,
    projects: projects.length,
    contributor_slots: projects.length,
    mentor_slots: projects.reduce((sum, project) => sum + (project.mentors ?? []).filter((name) => name.trim()).length, 0),
    projects_without_contributor: 0,
  };
  const mismatches = Object.entries(expected).filter(([key, value]) => counts[key] !== value);
  console.log(JSON.stringify({ expected, actual: counts, status: mismatches.length ? "MISMATCH" : "OK" }, null, 2));
  if (mismatches.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
