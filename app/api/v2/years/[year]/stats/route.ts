import { apiData, apiError } from "@/lib/api-response";
import { getYearCounts } from "@/lib/catalog/years";

export async function GET(_request: Request, { params }: { params: Promise<{ year: string }> }) {
  const { year: rawYear } = await params;
  const year = Number.parseInt(rawYear, 10);
  if (!Number.isInteger(year) || year < 2005 || year > 2100) return apiError("INVALID_YEAR", "Year is invalid", 400);
  try {
    const [row] = await getYearCounts(year);
    if (!row || (row.announced === 0 && row.projects === 0)) return apiError("NOT_FOUND", "No catalog data exists for this year", 404);
    return apiData({
      year,
      projects: row.projects,
      contributors: row.contributors,
      organizations: row.participating,
      counts: { announced: row.announced, participating: row.participating, withdrawn: row.withdrawn },
      finalized: year < new Date().getUTCFullYear(),
    });
  } catch (error) {
    console.error("[api/v2/years/:year/stats]", error);
    return apiError("CATALOG_UNAVAILABLE", "Year statistics are temporarily unavailable", 503);
  }
}
