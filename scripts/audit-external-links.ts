import fs from "node:fs";

type Link = { url: string; source: string };
type Result = Link & { status: number | null; classification: string; finalUrl?: string; error?: string };

const inputPath = process.argv[2];
const outputPath = process.argv[3];
const concurrency = Number.parseInt(process.argv[4] ?? "20", 10);
if (!inputPath) throw new Error("Usage: audit-external-links.ts <links.json> [report.json] [concurrency]");

const links = JSON.parse(fs.readFileSync(inputPath, "utf8")) as Link[];
const previousReport = outputPath && fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, "utf8")) as { results?: Result[] }
  : null;
const results: Result[] = Array.isArray(previousReport?.results) ? previousReport.results : [];
const completedUrls = new Set(results.map((result) => result.url));
const pendingLinks = links.filter((link) => !completedUrls.has(link.url));
let cursor = 0;

function summarize() {
  const counts = Object.fromEntries(
    [...new Set(results.map((result) => result.classification))]
      .sort()
      .map((classification) => [classification, results.filter((result) => result.classification === classification).length]),
  );
  return { checked: results.length, total: links.length, counts, results };
}

function checkpoint() {
  if (outputPath) fs.writeFileSync(outputPath, JSON.stringify(summarize(), null, 2));
}

function classify(status: number | null): string {
  if (status === null) return "network_error";
  if (status >= 200 && status < 400) return "ok";
  if (status === 404 || status === 410) return "broken";
  if ([401, 403, 405, 429].includes(status)) return "blocked_or_rate_limited";
  if (status >= 500) return "server_error";
  return "other_http_error";
}

async function check(link: Link): Promise<Result> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    let response = await fetch(link.url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "gsoc-orgs-link-audit/1.0" },
    });
    if (response.status >= 400) {
      response = await fetch(link.url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "Mozilla/5.0 (compatible; gsoc-orgs-link-audit/1.0)" },
      });
    }
    return {
      ...link,
      status: response.status,
      classification: classify(response.status),
      finalUrl: response.url,
    };
  } catch (error) {
    return {
      ...link,
      status: null,
      classification: "network_error",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function worker() {
  while (cursor < pendingLinks.length) {
    const link = pendingLinks[cursor++];
    results.push(await check(link));
    if (results.length % 100 === 0) checkpoint();
    if (results.length % 500 === 0) console.error(`Checked ${results.length}/${links.length}`);
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
checkpoint();
const report = summarize();
console.log(JSON.stringify({ checked: report.checked, total: report.total, counts: report.counts }, null, 2));
