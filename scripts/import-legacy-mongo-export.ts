import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Document = Record<string, unknown>;

const exportDirectory = path.resolve(process.env.MONGO_EXPORT_DIR ?? "migration/mongo-export");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) throw new Error("Supabase service-role environment variables are required");
const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

function readDocuments(name: string): Document[] {
  const filename = path.join(exportDirectory, `${name}.json`);
  if (!fs.existsSync(filename)) return [];
  const raw = fs.readFileSync(filename, "utf8").trim();
  if (!raw) return [];
  if (raw.startsWith("[")) return JSON.parse(raw) as Document[];
  return raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as Document);
}

function objectId(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "$oid" in value) return String((value as { $oid: string }).$oid);
  return null;
}

function dateValue(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "$date" in value) return String((value as { $date: string }).$date);
  return null;
}

function chunks<T>(items: T[], size = 250) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

async function upsertMany(client: SupabaseClient, table: string, rows: Record<string, unknown>[], onConflict: string) {
  for (const batch of chunks(rows)) {
    const { error } = await client.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

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

async function main() {
  const organizations = readDocuments("organizations");
  const projects = readDocuments("projects");
  const waitlist = readDocuments("waitlist_entries");
  if (!organizations.length && !projects.length && !waitlist.length) throw new Error(`No Mongo export JSON found in ${exportDirectory}`);
  const sourceChecksum = createHash("sha256").update(JSON.stringify({ organizations, projects, waitlist })).digest("hex");
  const { data: run, error: runError } = await supabase.from("import_runs").insert({ source: "legacy-mongo-export", source_checksum: sourceChecksum, status: "running", counts: { organizations: organizations.length, projects: projects.length, waitlist: waitlist.length } }).select("id").single();
  if (runError) throw runError;

  try {
    const savedOrganizations = await selectAll<{ id: string; slug: string; name: string; category: string; description: string }>(
      supabase, "organizations", "id,slug,name,category,description",
    );
    const organizationBySlug = new Map(savedOrganizations.map((organization) => [organization.slug, organization]));
    const organizationRows = organizations.flatMap((document) => {
      const slug = String(document.slug ?? "");
      const existing = organizationBySlug.get(slug);
      if (!existing) return [];
      return [{
        ...existing,
        legacy_id: objectId(document._id),
        canonical_id: String(document.id ?? "") || null,
        source_payload: document,
      }];
    });
    await upsertMany(supabase, "organizations", organizationRows, "slug");

    const savedProjects = await selectAll<{ id: string; external_id: string; organization_id: string; year: number; title: string }>(
      supabase, "projects", "id,external_id,organization_id,year,title",
    );
    const projectByExternalId = new Map(savedProjects.map((project) => [project.external_id, project]));
    const projectRows = projects.flatMap((document) => {
      const externalId = String(document.project_id ?? "");
      const existing = projectByExternalId.get(externalId);
      if (!existing) return [];
      return [{
        ...existing,
        legacy_id: objectId(document._id),
        abstract_short: document.project_abstract_short ?? null,
        info_html: document.project_info_html ?? null,
        code_url: document.project_code_url ?? null,
        source_created_at: dateValue(document.date_created),
        source_updated_at: dateValue(document.date_updated),
        source_payload: document,
      }];
    });
    await upsertMany(supabase, "projects", projectRows, "external_id");

    if (waitlist.length) {
      const rows = waitlist.map((document) => ({ email: String(document.email).trim().toLowerCase(), interests: document.interests ?? [], source: document.source ?? "website", created_at: dateValue(document.createdAt) ?? new Date().toISOString(), invited_at: dateValue(document.invitedAt), converted_at: dateValue(document.convertedAt) }));
      await upsertMany(supabase, "waitlist_entries", rows, "email");
    }
    await supabase.from("import_runs").update({ status: "completed", completed_at: new Date().toISOString(), counts: { organizations: organizationRows.length, projects: projectRows.length, waitlist: waitlist.length } }).eq("id", run.id);
    console.log(JSON.stringify({ sourceChecksum, organizations: organizationRows.length, projects: projectRows.length, waitlist: waitlist.length }, null, 2));
  } catch (error) {
    await supabase.from("import_runs").update({ status: "failed", completed_at: new Date().toISOString(), errors: [{ message: error instanceof Error ? error.message : String(error) }] }).eq("id", run.id);
    throw error;
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
