import { searchIndex } from "@/components/cobalt/data";

export const dynamic = "force-static";
// Hourly, so scheduled articles appear in search without a rebuild.
export const revalidate = 3600;

/** Index for the site search palette, fetched by the browser only when search is used. */
export function GET() {
  return Response.json(searchIndex(), {
    headers: { "X-Robots-Tag": "noindex" },
  });
}
