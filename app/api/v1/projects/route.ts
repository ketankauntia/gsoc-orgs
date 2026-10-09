import { NextRequest, NextResponse } from "next/server";
import { projectV1 } from "@/lib/catalog/legacy-shapes";
import { likeTerm, PROJECT_WITH_PEOPLE } from "@/lib/catalog/sql";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page")) || 1);
    const limit = Math.min(100, Number(params.get("limit")) || 20);
    const year = Number(params.get("year"));
    const rows = await db().query(
      `select p.*, ${PROJECT_WITH_PEOPLE}, count(*) over () as total_count
       from public.projects p join public.organizations o on o.id = p.organization_id
       where ($1::text is null or p.title ilike '%' || $1 || '%')
         and ($2::int is null or p.year = $2)
         and ($3::text is null or o.slug = $3::citext)
       order by p.source_updated_at desc nulls last, p.title
       limit $4 offset $5`,
      [likeTerm(params.get("q")), Number.isFinite(year) && year > 0 ? year : null, params.get("org") || null, limit, (page - 1) * limit],
    );
    const total = Number(rows[0]?.total_count ?? 0);
    return NextResponse.json(
      { success: true, data: { projects: rows.map(projectV1), pagination: { page, limit, total, pages: Math.ceil(total / limit) } }, meta: { timestamp: new Date().toISOString(), version: "v1" } },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
    );
  } catch (error) {
    console.error("Projects API error:", error);
    return NextResponse.json({ success: false, error: { message: "Failed to fetch projects", code: "FETCH_ERROR" } }, { status: 500 });
  }
}
