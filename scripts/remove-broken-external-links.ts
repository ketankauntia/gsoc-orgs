import fs from "node:fs";
import path from "node:path";

type AuditResult = {
  url: string;
  source: string;
  status: number | null;
  classification: string;
  finalUrl?: string;
};

const reportPath = process.argv[2];
const inventoryPath = process.argv[3];
if (!reportPath || !inventoryPath) {
  throw new Error("Usage: remove-broken-external-links.ts <external-audit-report.json> <inventory.json>");
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as { results: AuditResult[] };
const broken = report.results
  .filter((result) => result.classification === "broken")
  .sort((a, b) => a.url.localeCompare(b.url));
const comparableUrls = new Set(
  broken.map((result) => result.url.replaceAll("&amp;", "&").replaceAll("&#x27;", "'")),
);

function isBroken(value: string): boolean {
  return comparableUrls.has(value.replaceAll("&amp;", "&").replaceAll("&#x27;", "'"));
}

let removals = 0;
function clean(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .filter((item) => {
        if (typeof item === "string" && isBroken(item)) {
          removals++;
          return false;
        }
        if (item && typeof item === "object" && "value" in item) {
          const candidate = (item as { value?: unknown }).value;
          if (typeof candidate === "string" && isBroken(candidate)) {
            removals++;
            return false;
          }
        }
        return true;
      })
      .map(clean);
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (typeof child === "string" && isBroken(child)) {
        removals++;
        continue;
      }
      result[key] = clean(child);
    }
    return result;
  }
  return value;
}

let changedFiles = 0;
function walk(directory: string) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    try {
      const original = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      const before = removals;
      const cleaned = clean(original);
      if (removals > before) {
        fs.writeFileSync(fullPath, JSON.stringify(cleaned, null, 2));
        changedFiles++;
      }
    } catch {
      // Ignore non-data JSON that cannot be parsed.
    }
  }
}

walk(path.join(process.cwd(), "new-api-details"));
fs.mkdirSync(path.dirname(inventoryPath), { recursive: true });
fs.writeFileSync(inventoryPath, JSON.stringify({ audited_at: "2026-08-18", links: broken }, null, 2));
console.log(JSON.stringify({ brokenUrls: broken.length, removals, changedFiles }, null, 2));
