import { getSearchIndex } from "@/lib/blog/content";

export const dynamic = "force-static";
// ISR: regenerate hourly so scheduled posts + content changes surface without a rebuild.
export const revalidate = 3600;

/** Static, build-time search index consumed by the client search (Fuse.js). Small enough to fetch once. */
export function GET() {
  return Response.json(getSearchIndex(), {
    // Data endpoint, not a page — keep it out of the index.
    headers: { "X-Robots-Tag": "noindex" },
  });
}
