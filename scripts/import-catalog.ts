import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { Client } from "@neondatabase/serverless";
import {
  assertNoVocabularySlugCollisions,
  buildVocabularyGroups,
  canonicalTechnology,
  canonicalTopic,
  vocabularyAliasKey,
} from "../lib/vocabulary/catalog";
import { workProductKind } from "../lib/work-product";

// Loads the checked-in archive JSON (new-api-details/) into Neon: organizations,
// years, projects, the people on each project, and the technology/topic
// vocabulary. Safe to re-run; rows are upserted by their natural keys.
//
//   npm run db:import-catalog              write to NEON_DATABASE_URL_UNPOOLED
//   npm run db:import-catalog -- --dry-run  count only, no database needed

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
    projects?: Array<{ project_url?: string; code_url?: string | null }>;
    withdrawn_at?: string;
  }>;
  stats?: { projects_by_year?: Record<string, number> };
};
type ProjectJson = {
  project_id: string; project_title: string; project_abstract_short?: string;
  project_description?: string; project_url?: string; project_code_url?: string | null;
  contributor: string; contributor_profile_url?: string | null; mentors?: string[];
  org_name: string; org_slug: string; year: number; tech_stack?: string[]; topic_tags?: string[];
  date_created?: string | null; date_updated?: string | null;
};
type Column = [name: string, type: string];
type Row = Record<string, unknown>;

const root = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const connectionString = process.env.NEON_DATABASE_URL_UNPOOLED ?? process.env.NEON_DATABASE_URL;
if (!dryRun && !connectionString) throw new Error("Set NEON_DATABASE_URL_UNPOOLED in .env.local, or use --dry-run");

function chunks<T>(items: T[], size = 500) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}
function checksum(value: unknown) {
  return createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest("hex");
}
function organizationYear(org: OrganizationJson, year: number) {
  return org.years?.[String(year)] ?? org.years?.[`year_${year}`];
}
function archivedProjectId(projectUrl: string | undefined) {
  return projectUrl?.match(/\/projects\/([^/?#]+)\/?$/)?.[1] ?? null;
}
const quote = (identifier: string) => `"${identifier}"`;

/** Batched insert ... on conflict update, sending each batch as one JSON parameter. */
async function upsert(client: Client, table: string, columns: Column[], rows: Row[], conflict: string[], update: string[]) {
  const names = columns.map(([name]) => quote(name)).join(", ");
  const record = columns.map(([name, type]) => `${quote(name)} ${type}`).join(", ");
  const action = update.length
    ? `do update set ${update.map((name) => `${quote(name)} = excluded.${quote(name)}`).join(", ")}`
    : "do nothing";
  const sql = `insert into public.${table} (${names}) select ${names} from jsonb_to_recordset($1::jsonb) as r(${record}) on conflict (${conflict.map(quote).join(", ")}) ${action}`;
  for (const batch of chunks(rows)) await client.query(sql, [JSON.stringify(batch)]);
}
async function idMap(client: Client, sql: string) {
  const { rows } = await client.query<{ key: string; id: string }>(sql);
  return new Map(rows.map((row) => [String(row.key).toLowerCase(), row.id]));
}

const orgDirectory = path.join(root, "new-api-details", "organizations");
const orgFiles = fs.readdirSync(orgDirectory).filter((file) => file.endsWith(".json") && !["index.json", "metadata.json"].includes(file)).sort();
const organizations: OrganizationJson[] = orgFiles.map((file) => JSON.parse(fs.readFileSync(path.join(orgDirectory, file), "utf8")));
const projectDirectory = path.join(root, "new-api-details", "projects");
const projectFiles = fs.readdirSync(projectDirectory).filter((file) => /^20\d{2}\.json$/.test(file)).sort();
const projects: ProjectJson[] = projectFiles.flatMap((file) => JSON.parse(fs.readFileSync(path.join(projectDirectory, file), "utf8")).projects ?? []);

const organizationByProjectId = new Map<string, OrganizationJson>();
const sourceProjectById = new Map<string, Row>();
for (const org of organizations) {
  for (const year of Object.values(org.years ?? {})) {
    for (const project of year?.projects ?? []) {
      const projectId = archivedProjectId(project.project_url);
      if (!projectId) continue;
      const existing = organizationByProjectId.get(projectId);
      if (existing && existing.slug !== org.slug) throw new Error(`Project ${projectId} is associated with multiple organizations`);
      organizationByProjectId.set(projectId, org);
      sourceProjectById.set(projectId, project as Row);
    }
  }
}
const unresolved = projects.filter((project) => !organizationByProjectId.has(project.project_id));
if (unresolved.length) throw new Error(`${unresolved.length} projects are missing an authoritative organization mapping`);

function workProduct(project: ProjectJson) {
  const source = sourceProjectById.get(project.project_id) ?? {};
  const url = (project.project_code_url ?? (source.code_url as string | null | undefined) ?? null) || null;
  const org = organizationByProjectId.get(project.project_id);
  return { url, kind: workProductKind(url, org?.url ?? org?.website ?? null) };
}

async function main() {
  const kinds: Record<string, number> = {};
  for (const project of projects) {
    const kind = workProduct(project).kind ?? "none";
    kinds[kind] = (kinds[kind] ?? 0) + 1;
  }
  const counts = {
    organizationFiles: organizations.length,
    projectFiles: projectFiles.length,
    projects: projects.length,
    contributorSlots: projects.length,
    mentorSlots: projects.reduce((sum, project) => sum + (project.mentors ?? []).filter((name) => name.trim()).length, 0),
    workProducts: kinds,
  };
  const sourceChecksum = checksum({
    orgFiles: orgFiles.map((file) => [file, checksum(fs.readFileSync(path.join(orgDirectory, file)))]),
    projectFiles: projectFiles.map((file) => [file, checksum(fs.readFileSync(path.join(projectDirectory, file)))]),
  });
  console.log(JSON.stringify({ dryRun, counts, sourceChecksum }, null, 2));
  if (dryRun) return;

  const client = new Client({ connectionString });
  await client.connect();
  const { rows: [run] } = await client.query<{ id: string }>(
    "insert into public.import_runs(source, source_checksum, status, counts) values ('checked-in-json', $1, 'running', $2) returning id",
    [sourceChecksum, JSON.stringify(counts)],
  );

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
    const organizationColumns: Column[] = [
      ["legacy_id", "text"], ["canonical_id", "text"], ["slug", "citext"], ["name", "text"], ["category", "text"],
      ["description", "text"], ["website", "text"], ["contact", "jsonb"], ["socials", "jsonb"], ["image_url", "text"],
      ["image_background_color", "text"], ["logo_r2_url", "text"], ["active_years", "integer[]"], ["first_year", "integer"],
      ["last_year", "integer"], ["first_time", "boolean"], ["is_currently_active", "boolean"], ["total_projects", "integer"],
      ["source_payload", "jsonb"],
    ];
    await upsert(client, "organizations", organizationColumns, organizationRows, ["slug"], organizationColumns.map(([name]) => name).filter((name) => name !== "slug"));
    const orgIds = await idMap(client, "select slug::text as key, id from public.organizations");

    const importedProjectCounts = new Map<string, number>();
    for (const project of projects) {
      const org = organizationByProjectId.get(project.project_id)!;
      const key = `${org.slug.toLowerCase()}:${project.year}`;
      importedProjectCounts.set(key, (importedProjectCounts.get(key) ?? 0) + 1);
    }
    const organizationYearRows = organizations.flatMap((org) => (org.active_years ?? org.years_appeared ?? []).map((year) => {
      const yearData = organizationYear(org, year);
      const withdrawn = org.withdrawn_years?.includes(year) ?? false;
      return {
        organization_id: orgIds.get(org.slug.toLowerCase()),
        year,
        project_count: importedProjectCounts.get(`${org.slug.toLowerCase()}:${year}`) ?? yearData?.num_projects ?? org.stats?.projects_by_year?.[`year_${year}`] ?? 0,
        archive_url: yearData?.projects_url ?? null,
        selection_status: withdrawn ? "withdrawn" : "selected",
        withdrawn_at: withdrawn ? yearData?.withdrawn_at ?? null : null,
        source_payload: yearData ?? {},
      };
    })).filter((row) => row.organization_id);
    await upsert(client, "organization_years", [
      ["organization_id", "uuid"], ["year", "integer"], ["project_count", "integer"], ["archive_url", "text"],
      ["selection_status", "text"], ["withdrawn_at", "timestamptz"], ["source_payload", "jsonb"],
    ], organizationYearRows, ["organization_id", "year"], ["project_count", "archive_url", "selection_status", "withdrawn_at", "source_payload"]);

    const projectRows = projects.map((project) => {
      const source = sourceProjectById.get(project.project_id) ?? {};
      const org = organizationByProjectId.get(project.project_id)!;
      const product = workProduct(project);
      return {
        external_id: project.project_id,
        organization_id: orgIds.get(org.slug.toLowerCase()),
        year: project.year,
        title: project.project_title,
        abstract_short: project.project_abstract_short ?? source.short_description ?? null,
        info_html: project.project_description ?? source.description ?? null,
        project_url: project.project_url ?? source.project_url ?? null,
        code_url: product.url,
        work_product_url: product.url,
        work_product_kind: product.kind,
        source_created_at: project.date_created ?? null,
        source_updated_at: project.date_updated ?? null,
        source_payload: { ...source, ...project },
      };
    });
    if (projectRows.some((row) => !row.organization_id)) throw new Error("Some projects reference unknown organizations");
    const projectColumns: Column[] = [
      ["external_id", "text"], ["organization_id", "uuid"], ["year", "integer"], ["title", "text"], ["abstract_short", "text"],
      ["info_html", "text"], ["project_url", "text"], ["code_url", "text"], ["work_product_url", "text"], ["work_product_kind", "text"],
      ["source_created_at", "timestamptz"], ["source_updated_at", "timestamptz"], ["source_payload", "jsonb"],
    ];
    await upsert(client, "projects", projectColumns, projectRows, ["external_id"], projectColumns.map(([name]) => name).filter((name) => name !== "external_id"));
    const projectIds = await idMap(client, "select external_id as key, id from public.projects");

    const peopleRows = projects.flatMap((project) => {
      const projectId = projectIds.get(project.project_id.toLowerCase());
      const contributor = { project_id: projectId, role: "contributor", archived_name: project.contributor.trim(), archived_profile_url: project.contributor_profile_url ?? null, ordinal: 1 };
      const mentors = (project.mentors ?? []).map((name) => name.trim()).filter(Boolean)
        .map((name, index) => ({ project_id: projectId, role: "mentor", archived_name: name, archived_profile_url: null, ordinal: index + 1 }));
      return [contributor, ...mentors];
    });
    await upsert(client, "project_people", [
      ["project_id", "uuid"], ["role", "text"], ["archived_name", "text"], ["archived_profile_url", "text"], ["ordinal", "smallint"],
    ], peopleRows, ["project_id", "role", "ordinal"], ["archived_name", "archived_profile_url"]);
    // Drop mentor rows the archive no longer lists, unless someone has claimed them.
    await client.query(
      `delete from public.project_people pp
       using public.projects p, jsonb_to_recordset($1::jsonb) as c(external_id text, mentors integer)
       where pp.project_id = p.id and p.external_id = c.external_id and pp.role = 'mentor' and pp.ordinal > c.mentors
         and not exists (select 1 from public.participations pa where pa.person_id = pp.id)`,
      [JSON.stringify(projects.map((project) => ({ external_id: project.project_id, mentors: (project.mentors ?? []).filter((name) => name.trim()).length })))],
    );

    const rawTechnologyValues = [...organizations.flatMap((org) => org.technologies ?? []), ...projects.flatMap((project) => project.tech_stack ?? [])].filter(Boolean);
    const rawTechNames = [...new Set(rawTechnologyValues)].sort();
    assertNoVocabularySlugCollisions("technology", rawTechNames);
    const technologyGroups = buildVocabularyGroups("technology", rawTechnologyValues);
    await client.query("select public.consolidate_catalog_technologies($1::jsonb)", [JSON.stringify(technologyGroups)]);
    await upsert(client, "technologies", [["slug", "citext"], ["name", "text"]], technologyGroups.map(({ name, slug }) => ({ name, slug })), ["slug"], ["name"]);
    const techIds = await idMap(client, "select slug::text as key, id from public.technologies");
    await upsert(client, "technology_aliases", [
      ["technology_id", "uuid"], ["alias", "text"], ["normalized_alias", "citext"], ["source", "text"], ["review_status", "text"],
    ], rawTechNames.map((alias) => ({
      technology_id: techIds.get(canonicalTechnology(alias).slug), alias, normalized_alias: vocabularyAliasKey(alias), source: "google", review_status: "approved",
    })).filter((row) => row.technology_id), ["normalized_alias"], ["technology_id", "alias", "source", "review_status"]);
    await upsert(client, "project_technologies", [["project_id", "uuid"], ["technology_id", "uuid"]],
      projects.flatMap((project) => [...new Set((project.tech_stack ?? []).map((name) => canonicalTechnology(name).slug))].map((slug) => ({
        project_id: projectIds.get(project.project_id.toLowerCase()), technology_id: techIds.get(slug),
      }))).filter((row) => row.project_id && row.technology_id), ["project_id", "technology_id"], []);
    await upsert(client, "organization_technologies", [["organization_id", "uuid"], ["technology_id", "uuid"]],
      organizations.flatMap((org) => [...new Set((org.technologies ?? []).map((name) => canonicalTechnology(name).slug))].map((slug) => ({
        organization_id: orgIds.get(org.slug.toLowerCase()), technology_id: techIds.get(slug),
      }))).filter((row) => row.organization_id && row.technology_id), ["organization_id", "technology_id"], []);

    const rawTopicValues = organizations.flatMap((org) => org.topics ?? []).filter(Boolean);
    const rawTopicNames = [...new Set(rawTopicValues)].sort();
    assertNoVocabularySlugCollisions("topic", rawTopicNames);
    const topicGroups = buildVocabularyGroups("topic", rawTopicValues);
    await client.query("select public.consolidate_catalog_topics($1::jsonb)", [JSON.stringify(topicGroups)]);
    await upsert(client, "topics", [["slug", "citext"], ["name", "text"]], topicGroups.map(({ name, slug }) => ({ name, slug })), ["slug"], ["name"]);
    const topicIds = await idMap(client, "select slug::text as key, id from public.topics");
    await upsert(client, "topic_aliases", [
      ["topic_id", "uuid"], ["alias", "text"], ["normalized_alias", "citext"], ["source", "text"], ["review_status", "text"],
    ], rawTopicNames.map((alias) => ({
      topic_id: topicIds.get(canonicalTopic(alias).slug), alias, normalized_alias: vocabularyAliasKey(alias), source: "google", review_status: "approved",
    })).filter((row) => row.topic_id), ["normalized_alias"], ["topic_id", "alias", "source", "review_status"]);
    await upsert(client, "organization_topics", [["organization_id", "uuid"], ["topic_id", "uuid"]],
      organizations.flatMap((org) => [...new Set((org.topics ?? []).map((name) => canonicalTopic(name).slug))].map((slug) => ({
        organization_id: orgIds.get(org.slug.toLowerCase()), topic_id: topicIds.get(slug),
      }))).filter((row) => row.organization_id && row.topic_id), ["organization_id", "topic_id"], []);

    await client.query("update public.import_runs set status = 'completed', completed_at = now(), counts = $2 where id = $1", [
      run.id,
      JSON.stringify({ ...counts, importedOrganizations: organizationRows.length, importedProjects: projectRows.length, people: peopleRows.length, technologies: technologyGroups.length, topics: topicGroups.length }),
    ]);
    console.log("Catalog import completed.");
  } catch (error) {
    await client.query("update public.import_runs set status = 'failed', completed_at = now(), errors = $2 where id = $1", [
      run.id,
      JSON.stringify([{ message: error instanceof Error ? error.message : String(error) }]),
    ]);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
