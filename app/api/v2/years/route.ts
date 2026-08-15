import { apiData, apiError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await createAdminClient().from("year_stats").select("year,organizations,projects,contributors").order("year", { ascending: false });
    if (error) throw error;
    return apiData((data ?? []).filter((row): row is typeof row & { year: number } => row.year !== null).map((row) => ({ ...row, claimsAvailable: row.year <= 2025 })));
  } catch (error) {
    console.error("[api/v2/years]", error);
    return apiError("CATALOG_UNAVAILABLE", "Year data is temporarily unavailable", 503);
  }
}
