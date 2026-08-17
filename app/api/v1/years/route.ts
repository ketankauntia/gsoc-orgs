import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: stats, error: statsError } = await admin
      .from("year_stats")
      .select("year,projects,contributors");
    if (statsError) throw statsError;

    const orgYears: Array<{ year: number; selection_status: string }> = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data: page, error } = await admin
        .from("organization_years")
        .select("year,selection_status")
        .range(from, from + pageSize - 1);
      if (error) throw error;
      orgYears.push(...(page ?? []));
      if ((page?.length ?? 0) < pageSize) break;
    }

    const map = new Map<number, {
      year: number;
      organizations_count: number;
      announced_organizations_count: number;
      withdrawn_organizations_count: number;
      total_projects: number;
      total_students: number;
    }>();
    const getYear = (year: number) => map.get(year) ?? {
      year,
      organizations_count: 0,
      announced_organizations_count: 0,
      withdrawn_organizations_count: 0,
      total_projects: 0,
      total_students: 0,
    };

    for (const row of orgYears) {
      const item = getYear(row.year);
      item.announced_organizations_count += 1;
      if (row.selection_status === "withdrawn") item.withdrawn_organizations_count += 1;
      else item.organizations_count += 1;
      map.set(row.year, item);
    }
    for (const row of stats ?? []) {
      if (row.year === null) continue;
      const item = getYear(row.year);
      item.total_projects = row.projects ?? 0;
      item.total_students = row.contributors ?? 0;
      map.set(row.year, item);
    }

    const years = [...map.values()].sort((a, b) => b.year - a.year);
    return NextResponse.json(
      { success: true, data: { years, total_years: years.length }, meta: { timestamp: new Date().toISOString(), version: "v1" } },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error("Years API error:", error);
    return NextResponse.json({ success: false, error: { message: "Failed to fetch years", code: "FETCH_ERROR" } }, { status: 500 });
  }
}
