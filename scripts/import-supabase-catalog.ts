import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type OrganizationJson = Record<string, unknown> & {
  id?: string; id_?: string; canonical_id?: string; slug: string; name: string;
  category?: string; description?: string; short_desc?: string; url?: string; website?: string;
  contact?: unknown; social?: unknown; socials?: unknown; image_url?: string; image_background_color?: string;
  logo_bg_color?: string; logo_r2_url?: string; img_r2_url?: string; active_years?: number[];
  years_appeared?: number[]; first_year?: number; last_year?: number; first_time?: boolean;
  is_currently_active?: boolean; total_projects?: number; technologies?: string[]; topics?: string[];
  years?: Record<string, { num_projects?: number; projects_url?: string }>;
  stats?: { projects_by_year?: Record<string, number> };
};
type ProjectJson = { project_id: string; project_title: string; contributor: string; mentors?: string[]; org_name: string; org_slug: string; year: number; tech_stack?: string[] };

const root = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!dryRun && (!url || !serviceRoleKey)) throw new Error("Supabase service-role environment variables are required unless --dry-run is used");
const supabase = !dryRun ? createClient(url!, serviceRoleKey!, { auth: { persistSession: false } }) : null;

function chunks<T>(items: T[], size = 250) { const result: T[][] = []; for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size)); return result; }
function checksum(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `item-${checksum(value).slice(0, 10)}`; }
async function upsertMany(client: SupabaseClient, table: string, rows: Record<string, unknown>[], onConflict: string) { for (const batch of chunks(rows)) { const { error } = await client.from(table).upsert(batch, { onConflict }); if (error) throw new Error(`${table}: ${error.message}`); } }

const orgDirectory = path.join(root, "new-api-details", "organizations");
const orgFiles = fs.readdirSync(orgDirectory).filter((file) => file.endsWith(".json") && !["index.json", "metadata.json"].includes(file)).sort();
const organizations: OrganizationJson[] = orgFiles.map((file) => JSON.parse(fs.readFileSync(path.join(orgDirectory, file), "utf8")));
const projectDirectory = path.join(root, "new-api-details", "projects");
const projectFiles = fs.readdirSync(projectDirectory).filter((file) => /^(201[6-9]|202[0-5])\.json$/.test(file)).sort();
const projects: ProjectJson[] = projectFiles.flatMap((file) => JSON.parse(fs.readFileSync(path.join(projectDirectory, file), "utf8")).projects ?? []);

async function main() {
const counts = { organizationFiles: organizations.length, projectFiles: projectFiles.length, projects: projects.length, contributorSlots: projects.length, mentors: projects.reduce((sum, project) => sum + (project.mentors?.length ?? 0), 0) };
const sourceChecksum = checksum({ orgFiles: orgFiles.map((file) => [file, checksum(fs.readFileSync(path.join(orgDirectory, file)))]), projectFiles: projectFiles.map((file) => [file, checksum(fs.readFileSync(path.join(projectDirectory, file)))]) });
console.log(JSON.stringify({ dryRun, counts, sourceChecksum }, null, 2));
if (dryRun) process.exit(0);

const client = supabase!;
const { data: run, error: runError } = await client.from("import_runs").insert({ source: "checked-in-json", source_checksum: sourceChecksum, status: "running", counts }).select("id").single();
if (runError) throw runError;

try {
  const organizationRows = organizations.map((org) => ({
    legacy_id: org.id ? String(org.id) : null,
    canonical_id: org.canonical_id ?? org.id_ ?? null,
    slug: String(org.slug),
    name: String(org.name),
    category: String(org.category ?? ""),
    description: String(org.description ?? org.short_desc ?? ""),
    website: org.url ?? org.website ?? null,
    contact: org.contact ?? {},
    socials: org.social ?? org.socials ?? {},
    image_url: org.image_url ?? null,
    image_background_color: org.image_background_color ?? org.logo_bg_color ?? null,
    logo_r2_url: org.logo_r2_url ?? org.img_r2_url ?? null,
    active_years: org.active_years ?? org.years_appeared ?? [],
    first_year: org.first_year ?? null,
    last_year: org.last_year ?? null,
    first_time: org.first_time ?? false,
    is_currently_active: org.is_currently_active ?? false,
    total_projects: org.total_projects ?? 0,
    source_payload: org,
  }));
  await upsertMany(client, "organizations", organizationRows, "slug");
  const { data: savedOrgs, error: savedOrgError } = await client.from("organizations").select("id,slug"); if (savedOrgError) throw savedOrgError;
  const orgIds = new Map((savedOrgs ?? []).map((org) => [String(org.slug).toLowerCase(), org.id]));

  const organizationYears = organizations.flatMap((org) => (org.active_years ?? org.years_appeared ?? []).map((year: number) => ({ organization_id: orgIds.get(String(org.slug).toLowerCase()), year, project_count: org.years?.[String(year)]?.num_projects ?? org.stats?.projects_by_year?.[`year_${year}`] ?? 0, archive_url: org.years?.[String(year)]?.projects_url ?? null, source_payload: org.years?.[String(year)] ?? {} }))).filter((row) => row.organization_id);
  await upsertMany(client, "organization_years", organizationYears, "organization_id,year");

  const projectRows = projects.map((project) => ({ external_id: project.project_id, organization_id: orgIds.get(project.org_slug.toLowerCase()), year: project.year, title: project.project_title, abstract_short: null, source_payload: project })).filter((row) => row.organization_id);
  if (projectRows.length !== projects.length) throw new Error(`${projects.length - projectRows.length} projects reference unknown organizations`);
  await upsertMany(client, "projects", projectRows, "external_id");
  const { data: savedProjects, error: savedProjectError } = await client.from("projects").select("id,external_id"); if (savedProjectError) throw savedProjectError;
  const projectIds = new Map((savedProjects ?? []).map((project) => [project.external_id, project.id]));

  const contributorRows = projects.map((project) => ({ project_id: projectIds.get(project.project_id), archived_name: project.contributor.trim(), ordinal: 1 }));
  await upsertMany(client, "project_contributors", contributorRows, "project_id,ordinal");
  const mentorRows = projects.flatMap((project) => (project.mentors ?? []).map((name, index) => ({ project_id: projectIds.get(project.project_id), name, ordinal: index + 1 })));
  await upsertMany(client, "project_mentors", mentorRows, "project_id,ordinal");

  const techNames = [...new Set([
    ...organizations.flatMap((org) => org.technologies ?? []),
    ...projects.flatMap((project) => project.tech_stack ?? []),
  ].filter(Boolean))].sort();
  await upsertMany(client, "technologies", techNames.map((name) => ({ name, slug: slugify(name) })), "name");
  const { data: savedTechs, error: savedTechError } = await client.from("technologies").select("id,name"); if (savedTechError) throw savedTechError;
  const techIds = new Map((savedTechs ?? []).map((tech) => [tech.name, tech.id]));
  const projectTechRows = projects.flatMap((project) => (project.tech_stack ?? []).map((name) => ({ project_id: projectIds.get(project.project_id), technology_id: techIds.get(name) }))).filter((row) => row.project_id && row.technology_id);
  await upsertMany(client, "project_technologies", projectTechRows, "project_id,technology_id");

  const organizationTechRows = organizations.flatMap((org) => (org.technologies ?? []).map((name: string) => ({ organization_id: orgIds.get(String(org.slug).toLowerCase()), technology_id: techIds.get(name) }))).filter((row) => row.organization_id && row.technology_id);
  await upsertMany(client, "organization_technologies", organizationTechRows, "organization_id,technology_id");

  const topicNames = [...new Set(organizations.flatMap((org) => org.topics ?? []).filter(Boolean))].sort();
  await upsertMany(client, "topics", topicNames.map((name) => ({ name, slug: slugify(name) })), "name");
  const { data: savedTopics, error: savedTopicError } = await client.from("topics").select("id,name"); if (savedTopicError) throw savedTopicError;
  const topicIds = new Map((savedTopics ?? []).map((topic) => [topic.name, topic.id]));
  const organizationTopicRows = organizations.flatMap((org) => (org.topics ?? []).map((name: string) => ({ organization_id: orgIds.get(String(org.slug).toLowerCase()), topic_id: topicIds.get(name) }))).filter((row) => row.organization_id && row.topic_id);
  await upsertMany(client, "organization_topics", organizationTopicRows, "organization_id,topic_id");

  await client.from("import_runs").update({ status: "completed", completed_at: new Date().toISOString(), counts: { ...counts, importedOrganizations: organizationRows.length, importedProjects: projectRows.length, technologies: techNames.length, topics: topicNames.length } }).eq("id", run.id);
  console.log("Supabase catalog import completed.");
} catch (error) {
  await client.from("import_runs").update({ status: "failed", completed_at: new Date().toISOString(), errors: [{ message: error instanceof Error ? error.message : String(error) }] }).eq("id", run.id);
  throw error;
}
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
