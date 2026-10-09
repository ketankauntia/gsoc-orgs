import { NextResponse } from "next/server";
import { getYearCounts } from "@/lib/catalog/years";

export async function GET() {
  try {
    const years = (await getYearCounts()).map((row) => ({
      year: row.year,
      organizations_count: row.participating,
      announced_organizations_count: row.announced,
      withdrawn_organizations_count: row.withdrawn,
      total_projects: row.projects,
      total_students: row.contributors,
    }));
    return NextResponse.json(
      { success: true, data: { years, total_years: years.length }, meta: { timestamp: new Date().toISOString(), version: "v1" } },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error("Years API error:", error);
    return NextResponse.json({ success: false, error: { message: "Failed to fetch years", code: "FETCH_ERROR" } }, { status: 500 });
  }
}
