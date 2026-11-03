import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Reads catalog JSON from new-api-details/. The catalog is too large to bundle
 * into the Cloudflare Worker script, so `npm run cf:build` copies it into the
 * static assets under CATALOG_ASSET_PATH and the Worker reads it through the
 * ASSETS binding. Node (next dev, next build) reads the checked-in files.
 */

export const CATALOG_ASSET_PATH = "/_catalog";

const CATALOG_FILE = /^[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)?\.json$/;
const onWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

// Parsed documents are shared like module imports were. The budget keeps an
// isolate well under the Workers memory limit; the per-year project files that
// every organization page reads fit in it. `next dev` skips the cache so edited
// files show up on reload.
const useCache = onWorkers || process.env.NODE_ENV === "production";
const MAX_CACHED_SIZE = 32 * 1024 * 1024;
const cache = new Map<string, { value: unknown; size: number }>();
let cachedSize = 0;

async function readCatalogText(file: string): Promise<string> {
  if (!onWorkers) return readFile(path.join(process.cwd(), "new-api-details", file), "utf8");
  const { env } = await getCloudflareContext({ async: true });
  if (!env.ASSETS) {
    console.error("[catalog] ASSETS binding is not configured");
    throw new Error("ASSETS binding is not configured");
  }
  const response = await env.ASSETS.fetch(`https://assets.local${CATALOG_ASSET_PATH}/${file}`);
  if (!response.ok) {
    // A 404 is an unknown slug (callers return null). Anything else is an outage worth seeing.
    if (response.status !== 404) console.error(`[catalog] ${file}: HTTP ${response.status}`);
    throw new Error(`Catalog file ${file}: HTTP ${response.status}`);
  }
  return response.text();
}

/** A parsed catalog document, e.g. `readCatalogJson("organizations/index.json")`. Throws when missing. */
export async function readCatalogJson<T>(file: string): Promise<T> {
  const hit = useCache ? cache.get(file) : undefined;
  if (hit) {
    cache.delete(file);
    cache.set(file, hit);
    return hit.value as T;
  }
  if (!CATALOG_FILE.test(file)) throw new Error(`Invalid catalog file: ${file}`);

  const text = await readCatalogText(file);
  const value = JSON.parse(text) as T;
  if (!useCache) return value;
  const raced = cache.get(file);
  if (raced) return raced.value as T;
  if (text.length <= MAX_CACHED_SIZE) {
    cache.set(file, { value, size: text.length });
    cachedSize += text.length;
    for (const [key, entry] of cache) {
      if (cachedSize <= MAX_CACHED_SIZE) break;
      cache.delete(key);
      cachedSize -= entry.size;
    }
  }
  return value;
}
