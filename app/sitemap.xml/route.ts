import { absoluteSitemapUrl, SITEMAP_FILES } from "@/lib/sitemap-data";
import { sitemapIndexXml, xmlResponse } from "@/lib/sitemap-xml";

export const revalidate = 3600;

export function GET() {
  return xmlResponse(
    sitemapIndexXml(SITEMAP_FILES.map((file) => absoluteSitemapUrl(`/sitemaps/${file}`))),
  );
}
