import { NextRequest, NextResponse } from "next/server";
import { organizationV1 } from "@/lib/catalog/legacy-shapes";
import { legacyPaging, pageOf } from "@/lib/catalog/sql";
import { db } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { page, limit } = legacyPaging(request.nextUrl.searchParams, { limit: 20, max: 100 });
    const [technology] = await db()`select id, name, slug::text as slug from public.technologies where slug = ${slug.slice(0, 120)}::citext`;
    if (!technology) return NextResponse.json({ success: false, error: { message: "Technology not found", code: "NOT_FOUND" } }, { status: 404 });
    const { total, data } = await pageOf((take, skip) => db().query(
      `select o.*, count(*) over () as total_count
       from public.organization_technologies ot join public.organizations o on o.id = ot.organization_id
       where ot.technology_id = $1
       order by o.name
       limit $2 offset $3`,
      [technology.id, take, skip],
    ), limit, (page - 1) * limit);
    return NextResponse.json(
      {
        success: true,
        data: {
          technology: { name: technology.name, slug: technology.slug, usage_count: total },
          organizations: data.map(organizationV1),
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
        meta: { timestamp: new Date().toISOString(), version: "v1" },
      },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error("Tech stack detail API error:", error);
    return NextResponse.json({ success: false, error: { message: "Failed to fetch technology details", code: "FETCH_ERROR" } }, { status: 500 });
  }
}
