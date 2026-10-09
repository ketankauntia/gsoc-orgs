import { apiData, apiError } from "@/lib/api-response";
import { getYearCounts } from "@/lib/catalog/years";

export async function GET() {
  try {
    const currentYear = new Date().getUTCFullYear();
    const years = await getYearCounts();
    return apiData(years.map((row) => ({
      year: row.year,
      organizations: row.participating,
      projects: row.projects,
      contributors: row.contributors,
      counts: { announced: row.announced, withdrawn: row.withdrawn, participating: row.participating },
      claimsAvailable: row.year <= currentYear,
    })));
  } catch (error) {
    console.error("[api/v2/years]", error);
    return apiError("CATALOG_UNAVAILABLE", "Year data is temporarily unavailable", 503);
  }
}
