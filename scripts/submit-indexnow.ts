import "./load-env";
import { readdirSync } from "node:fs";
import path from "node:path";

/**
 * Submits the site's canonical URLs to the IndexNow endpoint.
 *
 * IndexNow lets Bing, Yandex, Naver, and Seznam pull changed pages without waiting
 * for a scheduled crawl. Google does not participate, so this complements rather
 * than replaces a Search Console sitemap submission.
 *
 * Ownership is proved by a key file served from the site root. The key is public by
 * design; it only demonstrates that whoever submits controls the host.
 *
 * Usage:
 *   npx tsx scripts/submit-indexnow.ts --dry-run
 *   npx tsx scripts/submit-indexnow.ts
 *   npx tsx scripts/submit-indexnow.ts --limit 500 --only organizations
 */

const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH_SIZE = 10_000; // IndexNow accepts at most 10,000 URLs per request.

const args = process.argv.slice(2);

function flag(name: string): boolean {
  return args.includes(`--${name}`);
}

function option(name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

function resolveKey(): string {
  const fromEnv = process.env.INDEXNOW_KEY;
  if (fromEnv) return fromEnv.trim();

  const publicDir = path.join(process.cwd(), "public");
  const keyFiles = readdirSync(publicDir).filter((file) => /^[0-9a-f]{8,128}\.txt$/.test(file));
  if (keyFiles.length === 1) return keyFiles[0].replace(/\.txt$/, "");
  if (keyFiles.length === 0) {
    throw new Error(
      "No IndexNow key found. Set INDEXNOW_KEY or add public/<key>.txt containing the key.",
    );
  }
  throw new Error(
    `Multiple IndexNow key files found (${keyFiles.join(", ")}). Set INDEXNOW_KEY to pick one.`,
  );
}

function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gsocorganizationsguide.com";
  return raw.replace(/\/$/, "");
}

function extractTags(xml: string, tag: string): string[] {
  const pattern = new RegExp(`<${tag}>\s*([^<]+?)\s*</${tag}>`, "g");
  return [...xml.matchAll(pattern)].map((match) => match[1]);
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "user-agent": "gsoc-orgs-indexnow/1.0" } });
  if (!response.ok) throw new Error(`GET ${url} failed with ${response.status}`);
  return response.text();
}

async function collectUrls(origin: string, only?: string): Promise<string[]> {
  const index = await fetchText(`${origin}/sitemap.xml`);
  const childSitemaps = extractTags(index, "loc").filter((loc) => !only || loc.includes(only));
  if (childSitemaps.length === 0) {
    throw new Error(only ? `No sitemap matched "${only}"` : "Sitemap index contained no children");
  }

  const urls = new Set<string>();
  for (const sitemap of childSitemaps) {
    const body = await fetchText(sitemap);
    for (const loc of extractTags(body, "loc")) urls.add(loc);
    console.log(`  ${sitemap} -> ${urls.size} cumulative URLs`);
  }
  return [...urls];
}

async function submit(host: string, key: string, urlList: string[]): Promise<void> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `https://${host}/${key}.txt`,
      urlList,
    }),
  });

  // 200 accepted, 202 accepted but key still being validated.
  if (response.status !== 200 && response.status !== 202) {
    throw new Error(`IndexNow rejected the batch with ${response.status}: ${await response.text()}`);
  }
  console.log(`  submitted ${urlList.length} URLs (HTTP ${response.status})`);
}

async function main() {
  const origin = siteOrigin();
  const host = new URL(origin).host;
  const key = resolveKey();
  const limit = Number(option("limit") ?? "0");
  const only = option("only");

  console.log(`IndexNow submission for ${host}`);
  console.log(`  key file: ${origin}/${key}.txt`);

  const keyFileBody = await fetchText(`${origin}/${key}.txt`).catch(() => null);
  if (keyFileBody?.trim() !== key) {
    throw new Error(
      `The key file at ${origin}/${key}.txt is missing or does not contain the key. Deploy it before submitting.`,
    );
  }

  console.log("Collecting URLs from the sitemap index...");
  let urls = await collectUrls(origin, only);
  if (limit > 0) urls = urls.slice(0, limit);
  console.log(`Collected ${urls.length} URLs.`);

  if (flag("dry-run")) {
    console.log("Dry run; nothing submitted. First 5 URLs:");
    for (const url of urls.slice(0, 5)) console.log(`  ${url}`);
    return;
  }

  for (let start = 0; start < urls.length; start += BATCH_SIZE) {
    await submit(host, key, urls.slice(start, start + BATCH_SIZE));
  }
  console.log("Done.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
