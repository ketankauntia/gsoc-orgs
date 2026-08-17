import { apiData, apiError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: stats, error: statsError } = await admin.from("year_stats").select("year,organizations,projects,contributors");
    if (statsError) throw statsError;

    const orgYears: Array<{ year: number; selection_status: string }> = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data: page, error } = await admin.from("organization_years").select("year,selection_status").range(from, from + pageSize - 1);
      if (error) throw error;
      orgYears.push(...(page ?? []));
      if ((page?.length ?? 0) < pageSize) break;
    }

    const statsByYear = new Map((stats ?? []).filter((row): row is typeof row & { year: number } => row.year !== null).map((row) => [row.year, row]));
    const countsByYear = new Map<number, { announced: number; withdrawn: number }>();
    for (const row of orgYears) {
      const counts = countsByYear.get(row.year) ?? { announced: 0, withdrawn: 0 };
      counts.announced += 1;
      if (row.selection_status === "withdrawn") counts.withdrawn += 1;
      countsByYear.set(row.year, counts);
    }

    return apiData([...countsByYear.entries()].sort(([left], [right]) => right - left).map(([year, counts]) => {
      const stat = statsByYear.get(year);
      const participating = counts.announced - counts.withdrawn;
      return {
        year,
        organizations: participating,
        projects: stat?.projects ?? 0,
        contributors: stat?.contributors ?? 0,
        counts: { ...counts, participating },
        claimsAvailable: year <= 2025,
      };
    }));
  } catch (error) {
    console.error("[api/v2/years]", error);
    return apiError("CATALOG_UNAVAILABLE", "Year data is temporarily unavailable", 503);
  }
}
