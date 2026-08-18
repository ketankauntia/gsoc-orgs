import { getSitemapEntries, SITEMAP_FILES } from "@/lib/sitemap-data";
import { sitemapUrlSetXml, xmlResponse } from "@/lib/sitemap-xml";

export const revalidate = 3600;

export function generateStaticParams() {
  return SITEMAP_FILES.map((file) => ({ file }));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  const entries = await getSitemapEntries(file);
  if (!entries) return new Response("Not found", { status: 404 });
  return xmlResponse(sitemapUrlSetXml(entries));
}
