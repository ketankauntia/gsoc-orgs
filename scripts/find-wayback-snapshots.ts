import fs from "node:fs";

type Result = { url: string; classification: string };
type Snapshot = { available: boolean; url?: string; timestamp?: string; status?: string };

const reportPath = process.argv[2];
const outputPath = process.argv[3];
if (!reportPath || !outputPath) {
  throw new Error("Usage: find-wayback-snapshots.ts <external-audit-report.json> <output.json>");
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as { results: Result[] };
const urls = report.results
  .filter((result) => result.classification === "broken")
  .map((result) => result.url);
const snapshots: Record<string, Snapshot> = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
  : {};
const pending = urls.filter((url) => !snapshots[url]);
let cursor = 0;

function checkpoint() {
  fs.writeFileSync(outputPath, JSON.stringify(snapshots, null, 2));
}

async function worker() {
  while (cursor < pending.length) {
    const originalUrl = pending[cursor++];
    try {
      const response = await fetch(
        `https://archive.org/wayback/available?url=${encodeURIComponent(originalUrl)}`,
        { headers: { "user-agent": "gsoc-orgs-link-audit/1.0" } },
      );
      const data = await response.json() as {
        archived_snapshots?: { closest?: { available?: boolean; url?: string; timestamp?: string; status?: string } };
      };
      const closest = data.archived_snapshots?.closest;
      snapshots[originalUrl] = closest?.available
        ? { available: true, url: closest.url?.replace(/^http:/, "https:"), timestamp: closest.timestamp, status: closest.status }
        : { available: false };
    } catch {
      snapshots[originalUrl] = { available: false };
    }
    checkpoint();
  }
}

await Promise.all(Array.from({ length: 8 }, () => worker()));
const values = Object.values(snapshots);
console.log(JSON.stringify({ checked: values.length, available: values.filter((value) => value.available).length }, null, 2));
