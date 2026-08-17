import { apiData, apiError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ year: string }> }) {
  const { year: rawYear } = await params;
  const year = Number.parseInt(rawYear, 10);
  if (!Number.isInteger(year) || year < 2005 || year > 2100) return apiError("INVALID_YEAR", "Year is invalid", 400);
  try {
    const admin = createAdminClient();
    const [{ data, error }, { data: orgYears, error: orgYearsError }] = await Promise.all([
      admin.from("year_stats").select("year,projects,organizations,contributors").eq("year", year).maybeSingle(),
      admin.from("organization_years").select("selection_status").eq("year", year),
    ]);
    if (error || orgYearsError) throw error ?? orgYearsError;
    const announced = orgYears?.length ?? 0;
    if (!data && announced === 0) return apiError("NOT_FOUND", "No catalog data exists for this year", 404);
    const withdrawn = orgYears?.filter((row) => row.selection_status === "withdrawn").length ?? 0;
    const participating = announced - withdrawn;
    return apiData({
      year,
      projects: data?.projects ?? 0,
      contributors: data?.contributors ?? 0,
      organizations: participating,
      counts: { announced, participating, withdrawn },
      finalized: year <= 2025,
    });
  } catch (error) {
    console.error("[api/v2/years/:year/stats]", error);
    return apiError("CATALOG_UNAVAILABLE", "Year statistics are temporarily unavailable", 503);
  }
}
