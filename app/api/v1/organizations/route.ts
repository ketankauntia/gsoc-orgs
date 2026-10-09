import { NextRequest, NextResponse } from "next/server";
import { organizationV1 } from "@/lib/catalog/legacy-shapes";
import { legacyPaging, likeTerm, pageOf } from "@/lib/catalog/sql";
import { db } from "@/lib/db";
import { canonicalTechnology } from "@/lib/vocabulary/catalog";

const ORDER: Record<string, string> = { projects: "o.total_projects desc, o.name", year: "o.first_year desc nulls last, o.name", name: "o.name" };

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const { page, limit } = legacyPaging(params, { limit: 20, max: 100 });
    const q = likeTerm(params.get("q"));
    const category = params.get("category") || null;
    const technology = params.get("technology");
    const year = Number(params.get("year"));
    const active = params.get("active");
    const includeWithdrawn = params.get("include_withdrawn") === "true";
    const order = ORDER[params.get("sort") ?? "name"] ?? ORDER.name;

    const { total, data } = await pageOf((take, skip) => db().query(
      `select o.*, count(*) over () as total_count
       from public.organizations o
       where ($1::text is null or o.name ilike '%' || $1 || '%' or o.description ilike '%' || $1 || '%')
         and ($2::text is null or o.category = $2)
         and ($3::int is null or exists (select 1 from public.organization_years oy where oy.organization_id = o.id and oy.year = $3 and ($4 or oy.selection_status = 'selected')))
         and ($5::boolean is null or o.is_currently_active = $5)
         and ($6::text is null or exists (select 1 from public.organization_technologies ot join public.technologies t on t.id = ot.technology_id
              where ot.organization_id = o.id and t.slug = $6::citext))
       order by ${order}
       limit $7 offset $8`,
      [
        q, category, Number.isFinite(year) && year > 0 ? year : null, includeWithdrawn,
        active === "true" ? true : active === "false" ? false : null,
        technology ? canonicalTechnology(technology).slug : null,
        take, skip,
      ],
    ), limit, (page - 1) * limit);
    return NextResponse.json(
      { success: true, data: { organizations: data.map(organizationV1), pagination: { page, limit, total, pages: Math.ceil(total / limit) } }, meta: { timestamp: new Date().toISOString(), version: "v1" } },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error("Organizations API error:", error);
    return NextResponse.json({ success: false, error: { message: "Failed to fetch organizations", code: "FETCH_ERROR" } }, { status: 500 });
  }
}
