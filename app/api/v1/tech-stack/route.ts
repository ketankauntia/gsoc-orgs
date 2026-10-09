import { NextRequest, NextResponse } from "next/server";
import { likeTerm } from "@/lib/catalog/sql";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const limit = Math.min(500, Number(params.get("limit")) || 100);
    const minimum = Number(params.get("min_usage")) || 1;
    const rows = await db().query(
      `select t.name, t.slug::text as slug, count(ot.organization_id)::int as usage_count
       from public.technologies t left join public.organization_technologies ot on ot.technology_id = t.id
       where ($1::text is null or t.name ilike '%' || $1 || '%')
       group by t.id
       having count(ot.organization_id) >= $2
       order by usage_count desc, t.name
       limit $3`,
      [likeTerm(params.get("q")), minimum, limit],
    );
    return NextResponse.json(
      { success: true, data: { technologies: rows, total: rows.length }, meta: { timestamp: new Date().toISOString(), version: "v1" } },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error("Tech stack API error:", error);
    return NextResponse.json({ success: false, error: { message: "Failed to fetch tech stack", code: "FETCH_ERROR" } }, { status: 500 });
  }
}
