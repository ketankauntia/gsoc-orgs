import { apiData, apiError } from "@/lib/api-response";
import { getArchiveFacets } from "@/lib/proposals/archive-search";

/**
 * Chooser data for the archive: every year, every organization, and the
 * technology vocabulary folded to one entry per real technology. Public and
 * cacheable — the client picks from these instead of typing a value that has
 * to match exactly.
 */
export async function GET() {
  try {
    const facets = await getArchiveFacets();
    return apiData(facets, undefined, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("[api/v2/archive/facets]", error);
    return apiError("CATALOG_UNAVAILABLE", "Archive filters are temporarily unavailable", 503);
  }
}
