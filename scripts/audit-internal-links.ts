import fs from "node:fs";
import path from "node:path";

const baseUrl = new URL(process.argv[2] ?? "http://127.0.0.1:3000");
const concurrency = Number.parseInt(process.argv[3] ?? "8", 10);
const externalOutputPath = process.argv[4];
const dataRoot = path.join(process.cwd(), "new-api-details");

type ProjectDocument = {
  projects?: Array<{ org_slug: string; project_id: string }>;
};

const seeds = new Set<string>([
  "/",
  "/about",
  "/blog",
  "/changelog",
  "/contact",
  "/contributor-blogs",
  "/organizations",
  "/projects",
  "/proposals",
  "/tech-stack",
  "/topics",
  "/yearly",
]);

for (const file of fs.readdirSync(path.join(dataRoot, "organizations"))) {
  if (file.endsWith(".json") && file !== "index.json" && file !== "metadata.json") {
    seeds.add(`/organizations/${encodeURIComponent(file.slice(0, -5))}`);
  }
}

for (const kind of ["tech-stack", "topics"] as const) {
  for (const file of fs.readdirSync(path.join(dataRoot, kind))) {
    if (file.endsWith(".json") && file !== "index.json" && file !== "metadata.json") {
      seeds.add(`/${kind}/${encodeURIComponent(file.slice(0, -5))}`);
    }
  }
}

for (const file of fs.readdirSync(path.join(dataRoot, "projects"))) {
  if (!/^\d{4}\.json$/.test(file)) continue;
  const year = file.slice(0, 4);
  seeds.add(`/projects/${year}`);
  seeds.add(`/yearly/google-summer-of-code-${year}`);
  const document = JSON.parse(
    fs.readFileSync(path.join(dataRoot, "projects", file), "utf8"),
  ) as ProjectDocument;
  for (const project of document.projects ?? []) {
    seeds.add(
      `/organizations/${encodeURIComponent(project.org_slug)}/projects/${encodeURIComponent(project.project_id)}`,
    );
  }
}

const paths = [...seeds];
const failures: Array<{ path: string; status: number; location: string | null }> = [];
const statusCounts = new Map<number, number>();
const externalLinks = new Map<string, string>();
let cursor = 0;

function discoverLinks(html: string, source: URL) {
  for (const match of html.matchAll(/\shref=(?:"([^"]+)"|'([^']+)')/gi)) {
    const href = match[1] ?? match[2];
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      const url = new URL(href, source);
      if (url.origin !== baseUrl.origin) {
        if (url.protocol === "http:" || url.protocol === "https:") {
          externalLinks.set(url.href, source.pathname);
        }
        continue;
      }
      const candidate = `${url.pathname}${url.search}`;
      if (!seeds.has(candidate)) {
        seeds.add(candidate);
        paths.push(candidate);
      }
    } catch {
      // Invalid hrefs are caught by the response audit that rendered them.
    }
  }
}

async function worker() {
  while (cursor < paths.length) {
    const pathName = paths[cursor++];
    try {
      const response = await fetch(new URL(pathName, baseUrl), { redirect: "manual" });
      statusCounts.set(response.status, (statusCounts.get(response.status) ?? 0) + 1);
      if (response.status >= 400) {
        failures.push({ path: pathName, status: response.status, location: response.headers.get("location") });
      }
      if (response.status === 200 && response.headers.get("content-type")?.includes("text/html")) {
        discoverLinks(await response.text(), new URL(pathName, baseUrl));
      }
    } catch {
      failures.push({ path: pathName, status: 0, location: null });
      statusCounts.set(0, (statusCounts.get(0) ?? 0) + 1);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

console.log(JSON.stringify({
  checked: paths.length,
  statuses: Object.fromEntries([...statusCounts].sort(([a], [b]) => a - b)),
  externalLinks: externalLinks.size,
  failures,
}, null, 2));

if (externalOutputPath) {
  fs.writeFileSync(
    externalOutputPath,
    JSON.stringify([...externalLinks].map(([url, source]) => ({ url, source })), null, 2),
  );
}

if (failures.length > 0) process.exitCode = 1;
