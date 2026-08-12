import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

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

async function main() {
  const organizations = readDocuments("organizations");
  const projects = readDocuments("projects");
  const waitlist = readDocuments("waitlist_entries");
  if (!organizations.length && !projects.length && !waitlist.length) throw new Error(`No Mongo export JSON found in ${exportDirectory}`);
  const sourceChecksum = createHash("sha256").update(JSON.stringify({ organizations, projects, waitlist })).digest("hex");
  const { data: run, error: runError } = await supabase.from("import_runs").insert({ source: "legacy-mongo-export", source_checksum: sourceChecksum, status: "running", counts: { organizations: organizations.length, projects: projects.length, waitlist: waitlist.length } }).select("id").single();
  if (runError) throw runError;

  try {
    for (const document of organizations) {
      const slug = String(document.slug ?? "");
      if (!slug) continue;
      const { error } = await supabase.from("organizations").update({ legacy_id: objectId(document._id), canonical_id: String(document.id ?? "") || null, source_payload: document }).eq("slug", slug);
      if (error) throw error;
    }
    for (const document of projects) {
      const externalId = String(document.project_id ?? "");
      if (!externalId) continue;
      const { error } = await supabase.from("projects").update({ legacy_id: objectId(document._id), abstract_short: document.project_abstract_short ?? null, info_html: document.project_info_html ?? null, code_url: document.project_code_url ?? null, source_created_at: dateValue(document.date_created), source_updated_at: dateValue(document.date_updated), source_payload: document }).eq("external_id", externalId);
      if (error) throw error;
    }
    if (waitlist.length) {
      const rows = waitlist.map((document) => ({ email: String(document.email).trim().toLowerCase(), interests: document.interests ?? [], source: document.source ?? "website", created_at: dateValue(document.createdAt) ?? new Date().toISOString(), invited_at: dateValue(document.invitedAt), converted_at: dateValue(document.convertedAt) }));
      const { error } = await supabase.from("waitlist_entries").upsert(rows, { onConflict: "email" });
      if (error) throw error;
    }
    await supabase.from("import_runs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", run.id);
    console.log(JSON.stringify({ sourceChecksum, organizations: organizations.length, projects: projects.length, waitlist: waitlist.length }, null, 2));
  } catch (error) {
    await supabase.from("import_runs").update({ status: "failed", completed_at: new Date().toISOString(), errors: [{ message: error instanceof Error ? error.message : String(error) }] }).eq("id", run.id);
    throw error;
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
