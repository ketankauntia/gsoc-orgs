import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { Client } from "@neondatabase/serverless";

// Restores the identifiers and source dates of the Mongo-era catalog that the
// JSON import does not carry: organizations.legacy_id and canonical_id (matched
// by slug) and projects.legacy_id, source_created_at and source_updated_at
// (matched by external_id). The /api/v1 responses read these as id, id_ and
// date_created. Only NULL columns are filled; a stored value that differs from
// the export is reported, never overwritten.
//
//   npx tsx scripts/backfill-legacy-ids.ts           dry run: counts and samples
//   npx tsx scripts/backfill-legacy-ids.ts --apply   write, in one transaction
//
// Reads migration/mongo-export/{organizations,projects}.json (MONGO_EXPORT_DIR
// overrides the directory).

type Document = Record<string, unknown>;
type ColumnType = "text" | "timestamptz";
type StoredRow = Record<string, unknown> & { id: string; key: string };
type Fill = Record<string, string> & { id: string };
type Table = {
  name: "organizations" | "projects";
  keyColumn: string;
  columns: Record<string, ColumnType>;
  unique: string[];
  keyOf: (document: Document) => string;
  valuesOf: (document: Document) => Record<string, string | null>;
  /** Second match for documents whose natural key no longer exists. */
  fallback?: (document: Document, values: Record<string, string | null>, rows: StoredRow[]) => StoredRow | undefined;
};

const apply = process.argv.includes("--apply");
const exportDirectory = path.resolve(process.env.MONGO_EXPORT_DIR ?? "migration/mongo-export");
const connectionString = process.env.NEON_DATABASE_URL_UNPOOLED ?? process.env.NEON_DATABASE_URL;
const SAMPLES = 10;

function readDocuments(name: string): Document[] {
  const filename = path.join(exportDirectory, `${name}.json`);
  if (!fs.existsSync(filename)) throw new Error(`Missing ${path.relative(process.cwd(), filename)}`);
  const raw = fs.readFileSync(filename, "utf8").trim();
  if (!raw) return [];
  if (raw.startsWith("[")) return JSON.parse(raw) as Document[];
  return raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as Document);
}

function objectId(value: unknown) {
  if (typeof value === "string") return value || null;
  if (value && typeof value === "object" && "$oid" in value) return String((value as { $oid: string }).$oid);
  return null;
}

function dateValue(value: unknown) {
  const raw = typeof value === "string"
    ? value
    : value && typeof value === "object" && "$date" in value ? (value as { $date: unknown }).$date : null;
  if (typeof raw === "number") return new Date(raw).toISOString();
  if (raw && typeof raw === "object" && "$numberLong" in raw) return new Date(Number((raw as { $numberLong: string }).$numberLong)).toISOString();
  return typeof raw === "string" && raw ? raw : null;
}

function chunks<T>(items: T[], size = 500) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

function sameValue(type: ColumnType, stored: unknown, incoming: string) {
  if (type === "text") return String(stored) === incoming;
  return new Date(stored as string | Date).getTime() === new Date(incoming).getTime();
}

function display(type: ColumnType, value: unknown) {
  return type === "timestamptz" && value instanceof Date ? value.toISOString() : value;
}

function plan(table: Table, documents: Document[], rows: StoredRow[]) {
  const columns = Object.entries(table.columns);
  const rowByKey = new Map(rows.map((row) => [row.key, row]));
  const owners = new Map(table.unique.map((column) => [
    column,
    new Map(rows.filter((row) => row[column] != null).map((row) => [String(row[column]), row])),
  ]));
  const matchedBy = new Map<string, string>();
  const fills: Fill[] = [];
  const filled: Record<string, number> = {};
  const alreadySet: Record<string, number> = {};
  const invalid: Array<Record<string, unknown>> = [];
  const conflicts: Array<Record<string, unknown>> = [];
  const unmatchedExport: string[] = [];
  const duplicateExportKeys: string[] = [];
  const fallbackMatches: Array<{ export: string; database: string }> = [];
  const seenKeys = new Set<string>();
  const pairs: Array<[key: string, values: Record<string, string | null>, row: StoredRow]> = [];
  const leftovers: Array<[key: string, values: Record<string, string | null>, document: Document]> = [];

  for (const document of documents) {
    const key = table.keyOf(document);
    if (!key || seenKeys.has(key)) { duplicateExportKeys.push(key); continue; }
    seenKeys.add(key);
    const values = table.valuesOf(document);
    const row = rowByKey.get(key);
    if (row) { pairs.push([key, values, row]); matchedBy.set(row.id, key); } else leftovers.push([key, values, document]);
  }
  for (const [key, values, document] of leftovers) {
    const row = table.fallback?.(document, values, rows);
    if (!row) { unmatchedExport.push(key); continue; }
    const previous = matchedBy.get(row.id);
    if (previous) { conflicts.push({ key: row.key, reason: `matched by export ${previous} and ${key}` }); continue; }
    pairs.push([key, values, row]);
    matchedBy.set(row.id, key);
    fallbackMatches.push({ export: key, database: row.key });
  }

  for (const [key, values, row] of pairs) {
    const fill: Fill = { id: row.id };
    for (const [column, type] of columns) {
      const incoming = values[column];
      if (incoming == null) continue;
      if (type === "timestamptz" && Number.isNaN(Date.parse(incoming))) { invalid.push({ key, column, export: incoming }); continue; }
      const stored = row[column];
      if (stored != null) {
        if (sameValue(type, stored, incoming)) alreadySet[column] = (alreadySet[column] ?? 0) + 1;
        else conflicts.push({ key: row.key, column, stored: display(type, stored), export: incoming });
        continue;
      }
      const owner = owners.get(column)?.get(incoming);
      if (owner && owner.id !== row.id) { conflicts.push({ key: row.key, column, export: incoming, reason: `already used by ${owner.key}` }); continue; }
      owners.get(column)?.set(incoming, row);
      fill[column] = incoming;
      filled[column] = (filled[column] ?? 0) + 1;
    }
    if (Object.keys(fill).length > 1) fills.push(fill);
  }

  const unmatchedDatabase = rows.filter((row) => !matchedBy.has(row.id)).map((row) => row.key).sort();
  const summary = {
    exportDocuments: documents.length,
    databaseRows: rows.length,
    matched: matchedBy.size,
    ...(table.fallback ? { matchedByLegacyId: fallbackMatches.length, matchedByLegacyIdSamples: fallbackMatches.slice(0, SAMPLES) } : {}),
    wouldUpdate: fills.length,
    fillsByColumn: filled,
    alreadySetByColumn: alreadySet,
    unmatchedInExport: unmatchedExport.length,
    unmatchedInExportSamples: unmatchedExport.slice(0, SAMPLES),
    unmatchedInDatabase: unmatchedDatabase.length,
    unmatchedInDatabaseSamples: unmatchedDatabase.slice(0, SAMPLES),
    duplicateOrEmptyExportKeys: duplicateExportKeys.length,
    invalidDates: invalid.length,
    invalidDateSamples: invalid.slice(0, SAMPLES),
    conflicts: conflicts.length,
    conflictSamples: conflicts.slice(0, SAMPLES),
  };
  return { fills, summary };
}

async function loadRows(client: Client, table: Table) {
  const columns = Object.keys(table.columns).map((column) => `"${column}"`).join(", ");
  const { rows } = await client.query<StoredRow>(`select id, ${table.keyColumn}::text as key, ${columns} from public.${table.name}`);
  return rows;
}

/** Fills only columns that are still NULL, so a concurrent write is never overwritten. */
async function write(client: Client, table: Table, fills: Fill[]) {
  const columns = Object.entries(table.columns);
  const record = ["id uuid", ...columns.map(([column, type]) => `"${column}" ${type}`)].join(", ");
  const assignments = columns.map(([column]) => `"${column}" = coalesce(t."${column}", r."${column}")`).join(", ");
  const sql = `update public.${table.name} as t set ${assignments} from jsonb_to_recordset($1::jsonb) as r(${record}) where t.id = r.id`;
  let updated = 0;
  for (const batch of chunks(fills)) updated += (await client.query(sql, [JSON.stringify(batch)])).rowCount ?? 0;
  if (updated !== fills.length) throw new Error(`${table.name}: expected to update ${fills.length} rows, updated ${updated}`);
  return updated;
}

const organizations: Table = {
  name: "organizations",
  keyColumn: "slug",
  columns: { legacy_id: "text", canonical_id: "text" },
  unique: ["legacy_id", "canonical_id"],
  keyOf: (document) => String(document.slug ?? ""),
  valuesOf: (document) => ({ legacy_id: objectId(document._id), canonical_id: String(document.id ?? "") || null }),
  // A few slugs were made ASCII after the export; those rows already carry the export's _id.
  fallback: (_document, values, rows) => (values.legacy_id ? rows.find((row) => row.legacy_id === values.legacy_id) : undefined),
};

const projects: Table = {
  name: "projects",
  keyColumn: "external_id",
  columns: { legacy_id: "text", source_created_at: "timestamptz", source_updated_at: "timestamptz" },
  unique: ["legacy_id"],
  keyOf: (document) => String(document.project_id ?? ""),
  valuesOf: (document) => ({
    legacy_id: objectId(document._id),
    source_created_at: dateValue(document.date_created),
    source_updated_at: dateValue(document.date_updated),
  }),
};

async function main() {
  if (!connectionString) throw new Error("Set NEON_DATABASE_URL_UNPOOLED in .env.local");
  const documents = { organizations: readDocuments("organizations"), projects: readDocuments("projects") };
  if (!documents.organizations.length && !documents.projects.length) throw new Error("The Mongo export is empty");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(apply ? "begin" : "begin transaction read only");
    const result: Record<string, unknown> = { mode: apply ? "apply" : "dry run" };
    const planned: Array<[Table, Fill[]]> = [];
    for (const table of [organizations, projects]) {
      const { fills, summary } = plan(table, documents[table.name], await loadRows(client, table));
      result[table.name] = summary;
      planned.push([table, fills]);
    }
    if (apply) {
      const updated: Record<string, number> = {};
      for (const [table, fills] of planned) updated[table.name] = await write(client, table, fills);
      await client.query("commit");
      result.updated = updated;
    } else {
      await client.query("rollback");
    }
    console.log(JSON.stringify(result, null, 2));
    if (!apply) console.log("Nothing was written. Re-run with --apply to fill the NULL columns.");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
