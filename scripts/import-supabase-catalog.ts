import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  assertNoVocabularySlugCollisions,
  buildVocabularyGroups,
  canonicalTechnology,
  canonicalTopic,
  vocabularyAliasKey,
} from "../lib/vocabulary/catalog";

type OrganizationJson = Record<string, unknown> & {
  id?: string; id_?: string; canonical_id?: string; slug: string; name: string;
  category?: string; description?: string; short_desc?: string; url?: string; website?: string;
  contact?: unknown; social?: unknown; socials?: unknown; image_url?: string; image_background_color?: string;
  logo_bg_color?: string; logo_r2_url?: string; img_r2_url?: string; active_years?: number[]; withdrawn_years?: number[];
  years_appeared?: number[]; first_year?: number; last_year?: number; first_time?: boolean;
  is_currently_active?: boolean; total_projects?: number; technologies?: string[]; topics?: string[];
  years?: Record<string, {
    num_projects?: number;
    projects_url?: string;
    projects?: Array<{ project_url?: string }>;
    withdrawn_at?: string;
  }>;
  stats?: { projects_by_year?: Record<string, number> };
};
type ProjectJson = {
  project_id: string; proposal_id?: string; project_title: string; project_abstract_short?: string;
  project_description?: string; project_url?: string; project_code_url?: string | null;
  contributor: string; contributor_profile_url?: string | null; mentors?: string[];
  org_name: string; org_slug: string; year: number; tech_stack?: string[]; topic_tags?: string[];
  difficulty?: string | null; status?: string | null; date_created?: string | null; date_updated?: string | null;
};

const root = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!dryRun && (!url || !serviceRoleKey)) throw new Error("Supabase service-role environment variables are required unless --dry-run is used");
const supabase = !dryRun ? createClient(url!, serviceRoleKey!, { auth: { persistSession: false } }) : null;

function chunks<T>(items: T[], size = 250) { const result: T[][] = []; for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size)); return result; }
function checksum(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
async function upsertMany(client: SupabaseClient, table: string, rows: Record<string, unknown>[], onConflict: string) { for (const batch of chunks(rows)) { const { error } = await client.from(table).upsert(batch, { onConflict }); if (error) throw new Error(`${table}: ${error.message}`); } }
async function selectAll<T extends Record<string, unknown>>(client: SupabaseClient, table: string, columns: string): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.from(table).select(columns).order("id", { ascending: true }).range(offset, offset + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const page = (data ?? []) as unknown as T[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
function organizationYear(org: OrganizationJson, year: number) {
  return org.years?.[String(year)] ?? org.years?.[`year_${year}`];
}
function archivedProjectId(projectUrl: string | undefined) {
  return projectUrl?.match(/\/projects\/([^/?#]+)\/?$/)?.[1] ?? null;
}
const orgDirectory = path.join(root, "new-api-details", "organizations");
const orgFiles = fs.readdirSync(orgDirectory).filter((file) => file.endsWith(".json") && !["index.json", "metadata.json"].includes(file)).sort();
const organizations: OrganizationJson[] = orgFiles.map((file) => JSON.parse(fs.readFileSync(path.join(orgDirectory, file), "utf8")));
const projectDirectory = path.join(root, "new-api-details", "projects");
const projectFiles = fs.readdirSync(projectDirectory).filter((file) => /^20\d{2}\.json$/.test(file)).sort();
const projects: ProjectJson[] = projectFiles.flatMap((file) => JSON.parse(fs.readFileSync(path.join(projectDirectory, file), "utf8")).projects ?? []);
const organizationSlugByProjectId = new Map<string, string>();
const sourceProjectById = new Map<string, Record<string, unknown>>();
for (const org of organizations) {
  for (const year of Object.values(org.years ?? {})) {
    for (const project of year?.projects ?? []) {
      const projectId = archivedProjectId(project.project_url);
      if (!projectId) continue;
      const existingSlug = organizationSlugByProjectId.get(projectId);
      if (existingSlug && existingSlug !== org.slug) {
        throw new Error(`Project ${projectId} is associated with multiple organizations`);
      }
      organizationSlugByProjectId.set(projectId, org.slug);
      sourceProjectById.set(projectId, project as Record<string, unknown>);
    }
  }
}
const unresolvedProjects = projects.filter((project) => !organizationSlugByProjectId.has(project.project_id));
if (unresolvedProjects.length) {
  throw new Error(`${unresolvedProjects.length} projects are missing an authoritative organization mapping`);
}

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
  const savedOrgs = await selectAll<{ id: string; slug: string }>(client, "organizations", "id,slug");
  const orgIds = new Map(savedOrgs.map((org) => [String(org.slug).toLowerCase(), org.id]));
  const importedProjectCounts = new Map<string, number>();
  projects.forEach((project) => {
    const key = `${project.org_slug.toLowerCase()}:${project.year}`;
    importedProjectCounts.set(key, (importedProjectCounts.get(key) ?? 0) + 1);
  });

  const organizationYears = organizations.flatMap((org) => (org.active_years ?? org.years_appeared ?? []).map((year: number) => {
    const yearData = organizationYear(org, year);
    const withdrawn = org.withdrawn_years?.includes(year) ?? false;
    return { organization_id: orgIds.get(String(org.slug).toLowerCase()), year, project_count: importedProjectCounts.get(`${String(org.slug).toLowerCase()}:${year}`) ?? yearData?.num_projects ?? org.stats?.projects_by_year?.[`year_${year}`] ?? 0, archive_url: yearData?.projects_url ?? null, selection_status: withdrawn ? "withdrawn" : "selected", withdrawn_at: withdrawn ? yearData?.withdrawn_at ?? null : null, source_payload: yearData ?? {} };
  })).filter((row) => row.organization_id);
  await upsertMany(client, "organization_years", organizationYears, "organization_id,year");

  const projectRows = projects.map((project) => {
    const sourceProject = sourceProjectById.get(project.project_id) ?? {};
    const organizationSlug = organizationSlugByProjectId.get(project.project_id) ?? project.org_slug;
    return {
      external_id: project.project_id,
      organization_id: organizationSlug ? orgIds.get(organizationSlug.toLowerCase()) : undefined,
      year: project.year,
      title: project.project_title,
      abstract_short: project.project_abstract_short ?? sourceProject.short_description ?? null,
      info_html: project.project_description ?? sourceProject.description ?? null,
      project_url: project.project_url ?? sourceProject.project_url ?? null,
      code_url: project.project_code_url ?? sourceProject.code_url ?? null,
      source_created_at: project.date_created ?? null,
      source_updated_at: project.date_updated ?? null,
      source_payload: { ...sourceProject, ...project },
    };
  }).filter((row) => row.organization_id);
  if (projectRows.length !== projects.length) throw new Error(`${projects.length - projectRows.length} projects reference unknown organizations`);
  await upsertMany(client, "projects", projectRows, "external_id");
  const savedProjects = await selectAll<{ id: string; external_id: string }>(client, "projects", "id,external_id");
  const projectIds = new Map(savedProjects.map((project) => [project.external_id, project.id]));

  const contributorRows = projects.map((project) => ({ project_id: projectIds.get(project.project_id), archived_name: project.contributor.trim(), archived_profile_url: project.contributor_profile_url ?? null, ordinal: 1 }));
  await upsertMany(client, "project_contributors", contributorRows, "project_id,ordinal");
  const mentorRows = projects.flatMap((project) => (project.mentors ?? []).map((name) => name.trim()).filter(Boolean).map((name, index) => ({ project_id: projectIds.get(project.project_id), name, ordinal: index + 1 })));
  await upsertMany(client, "project_mentors", mentorRows, "project_id,ordinal");

  const rawTechnologyValues = [
    ...organizations.flatMap((org) => org.technologies ?? []),
    ...projects.flatMap((project) => project.tech_stack ?? []),
  ].filter(Boolean);
  const rawTechNames = [...new Set(rawTechnologyValues)].sort();
  assertNoVocabularySlugCollisions("technology", rawTechNames);
  const technologyGroups = buildVocabularyGroups("technology", rawTechnologyValues);
  const { error: consolidateTechnologiesError } = await client.rpc("consolidate_catalog_technologies", { p_groups: technologyGroups });
  if (consolidateTechnologiesError) throw new Error(`consolidate_catalog_technologies: ${consolidateTechnologiesError.message}`);
  const technologyRows = technologyGroups.map(({ name, slug }) => ({ name, slug }));
  await upsertMany(client, "technologies", technologyRows, "slug");
  const savedTechs = await selectAll<{ id: string; slug: string }>(client, "technologies", "id,slug");
  const techIds = new Map(savedTechs.map((tech) => [String(tech.slug).toLowerCase(), tech.id]));
  const technologyAliasRows = rawTechNames.map((alias) => ({
    technology_id: techIds.get(canonicalTechnology(alias).slug),
    alias,
    normalized_alias: vocabularyAliasKey(alias),
    source: "google",
    review_status: "approved",
  })).filter((row) => row.technology_id);
  await upsertMany(client, "technology_aliases", technologyAliasRows, "normalized_alias");
  const projectTechRows = projects.flatMap((project) => (project.tech_stack ?? []).map((name) => ({ project_id: projectIds.get(project.project_id), technology_id: techIds.get(canonicalTechnology(name).slug) }))).filter((row) => row.project_id && row.technology_id);
  await upsertMany(client, "project_technologies", projectTechRows, "project_id,technology_id");

  const organizationTechRows = organizations.flatMap((org) => [...new Set((org.technologies ?? []).map((name: string) => canonicalTechnology(name).slug))].map((slug) => ({ organization_id: orgIds.get(String(org.slug).toLowerCase()), technology_id: techIds.get(slug) }))).filter((row) => row.organization_id && row.technology_id);
  await upsertMany(client, "organization_technologies", organizationTechRows, "organization_id,technology_id");

  const rawTopicValues = organizations.flatMap((org) => org.topics ?? []).filter(Boolean);
  const rawTopicNames = [...new Set(rawTopicValues)].sort();
  assertNoVocabularySlugCollisions("topic", rawTopicNames);
  const topicGroups = buildVocabularyGroups("topic", rawTopicValues);
  const { error: consolidateTopicsError } = await client.rpc("consolidate_catalog_topics", { p_groups: topicGroups });
  if (consolidateTopicsError) throw new Error(`consolidate_catalog_topics: ${consolidateTopicsError.message}`);
  const topicRows = topicGroups.map(({ name, slug }) => ({ name, slug }));
  await upsertMany(client, "topics", topicRows, "slug");
  const savedTopics = await selectAll<{ id: string; slug: string }>(client, "topics", "id,slug");
  const topicIds = new Map(savedTopics.map((topic) => [String(topic.slug).toLowerCase(), topic.id]));
  const topicAliasRows = rawTopicNames.map((alias) => ({
    topic_id: topicIds.get(canonicalTopic(alias).slug),
    alias,
    normalized_alias: vocabularyAliasKey(alias),
    source: "google",
    review_status: "approved",
  })).filter((row) => row.topic_id);
  await upsertMany(client, "topic_aliases", topicAliasRows, "normalized_alias");
  const organizationTopicRows = organizations.flatMap((org) => [...new Set((org.topics ?? []).map((name: string) => canonicalTopic(name).slug))].map((slug) => ({ organization_id: orgIds.get(String(org.slug).toLowerCase()), topic_id: topicIds.get(slug) }))).filter((row) => row.organization_id && row.topic_id);
  await upsertMany(client, "organization_topics", organizationTopicRows, "organization_id,topic_id");

  await client.from("import_runs").update({ status: "completed", completed_at: new Date().toISOString(), counts: { ...counts, importedOrganizations: organizationRows.length, importedProjects: projectRows.length, technologies: technologyRows.length, topics: topicRows.length } }).eq("id", run.id);
  console.log("Supabase catalog import completed.");
} catch (error) {
  await client.from("import_runs").update({ status: "failed", completed_at: new Date().toISOString(), errors: [{ message: error instanceof Error ? error.message : String(error) }] }).eq("id", run.id);
  throw error;
}
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
