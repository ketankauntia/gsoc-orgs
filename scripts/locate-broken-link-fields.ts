import fs from "node:fs";
import path from "node:path";

type AuditResult = { url: string; finalUrl?: string; classification: string; source: string };
type Match = AuditResult & { file: string; field: string; storedValue: string };

const reportPath = process.argv[2];
if (!reportPath) throw new Error("Usage: locate-broken-link-fields.ts <external-audit-report.json>");

const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as { results: AuditResult[] };
const broken = report.results.filter((result) => result.classification === "broken");
const byComparableUrl = new Map<string, AuditResult>();
for (const result of broken) {
  byComparableUrl.set(result.url.replaceAll("&amp;", "&").replaceAll("&#x27;", "'"), result);
}

const matches: Match[] = [];
function visit(value: unknown, file: string, field: string) {
  if (typeof value === "string") {
    const comparable = value.replaceAll("&amp;", "&").replaceAll("&#x27;", "'");
    const result = byComparableUrl.get(comparable);
    if (result) matches.push({ ...result, file, field, storedValue: value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, file, `${field}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      visit(child, file, field ? `${field}.${key}` : key);
    }
  }
}

function walk(directory: string) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    if (entry.isFile() && entry.name.endsWith(".json")) {
      try {
        visit(JSON.parse(fs.readFileSync(fullPath, "utf8")), path.relative(process.cwd(), fullPath), "");
      } catch {
        // Ignore non-data JSON that cannot be parsed.
      }
    }
  }
}

walk(path.join(process.cwd(), "new-api-details"));
console.log(JSON.stringify({ broken: broken.length, matches: matches.length, results: matches }, null, 2));
