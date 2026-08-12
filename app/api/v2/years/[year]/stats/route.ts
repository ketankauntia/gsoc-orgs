import { apiData, apiError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ year: string }> }) {
  const { year: rawYear } = await params;
  const year = Number.parseInt(rawYear, 10);
  if (!Number.isInteger(year) || year < 2005 || year > 2100) return apiError("INVALID_YEAR", "Year is invalid", 400);
  try {
    const { data, error } = await createAdminClient().from("year_stats").select("year,projects,organizations,contributors").eq("year", year).maybeSingle();
    if (error) throw error;
    if (!data) return apiError("NOT_FOUND", "No catalog data exists for this year", 404);
    return apiData({ ...data, finalized: year <= 2025 });
  } catch (error) {
    console.error("[api/v2/years/:year/stats]", error);
    return apiError("CATALOG_UNAVAILABLE", "Year statistics are temporarily unavailable", 503);
  }
}
