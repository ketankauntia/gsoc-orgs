export {};

const baseUrl = new URL(process.argv[2] ?? "http://127.0.0.1:3000");
const concurrency = Number.parseInt(process.argv[3] ?? "8", 10);

function locations(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    match[1]
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"')
      .replaceAll("&apos;", "'"),
  );
}

const indexResponse = await fetch(new URL("/sitemap.xml", baseUrl));
if (!indexResponse.ok) throw new Error(`Sitemap index returned ${indexResponse.status}`);
const indexXml = await indexResponse.text();
if (!indexXml.includes("<sitemapindex")) throw new Error("Root sitemap is not a sitemap index");
const sitemapUrls = locations(indexXml);
const canonicalOrigin = sitemapUrls.length > 0 ? new URL(sitemapUrls[0]).origin : null;
const pageUrls: string[] = [];
const perSitemap: Record<string, number> = {};

for (const sitemapUrl of sitemapUrls) {
  const url = new URL(sitemapUrl);
  if (!canonicalOrigin || url.origin !== canonicalOrigin) throw new Error(`Inconsistent sitemap origin: ${sitemapUrl}`);
  const response = await fetch(new URL(url.pathname, baseUrl));
  if (!response.ok) throw new Error(`${url.pathname} returned ${response.status}`);
  const xml = await response.text();
  if (!xml.includes("<urlset")) throw new Error(`${url.pathname} is not a URL set`);
  const urls = locations(xml);
  perSitemap[url.pathname] = urls.length;
  pageUrls.push(...urls);
}

const uniqueUrls = new Set(pageUrls);
if (uniqueUrls.size !== pageUrls.length) throw new Error(`Found ${pageUrls.length - uniqueUrls.size} duplicate URLs`);

const failures: Array<{ url: string; status: number }> = [];
let cursor = 0;
async function worker() {
  while (cursor < pageUrls.length) {
    const value = pageUrls[cursor++];
    const url = new URL(value);
    if (url.origin !== canonicalOrigin || url.search || url.hash) {
      failures.push({ url: value, status: 0 });
      continue;
    }
    try {
      const response = await fetch(new URL(url.pathname, baseUrl), { redirect: "manual" });
      if (response.status !== 200) failures.push({ url: value, status: response.status });
    } catch {
      failures.push({ url: value, status: 0 });
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
console.log(JSON.stringify({ sitemaps: sitemapUrls.length, urls: pageUrls.length, perSitemap, failures }, null, 2));
if (failures.length > 0) process.exitCode = 1;
