import { apiData, apiError, pagination } from "@/lib/api-response";
import { likeTerm, pageOf } from "@/lib/catalog/sql";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { page, limit, from } = pagination(url.searchParams);
    const year = Number.parseInt(url.searchParams.get("year") ?? "", 10);
    const active = url.searchParams.get("active");
    const includeWithdrawn = url.searchParams.get("include_withdrawn") === "true";
    const hasYear = Number.isFinite(year);
    const rows = await db().query(
      `select o.id, o.canonical_id, o.slug::text as slug, o.name, o.category, o.description, o.website, o.image_url, o.logo_r2_url,
         o.active_years, o.first_year, o.last_year, o.is_currently_active, o.total_projects, o.updated_at,
         ${hasYear ? `(select jsonb_agg(jsonb_build_object('year', oy.year, 'selection_status', oy.selection_status, 'withdrawn_at', oy.withdrawn_at))
            from public.organization_years oy where oy.organization_id = o.id and oy.year = $3 and ($4 or oy.selection_status = 'selected')) as organization_years,` : ""}
         count(*) over () as total_count
       from public.organizations o
       where ($1::text is null or o.name ilike '%' || $1 || '%')
         and ($2::boolean is null or o.is_currently_active = $2)
         and ($3::int is null or exists (select 1 from public.organization_years oy where oy.organization_id = o.id and oy.year = $3 and ($4 or oy.selection_status = 'selected')))
       order by o.name
       limit $5 offset $6`,
      [likeTerm(url.searchParams.get("q")), active === "true" ? true : active === "false" ? false : null, hasYear ? year : null, includeWithdrawn, limit, from],
    );
    const { total, data } = pageOf(rows);
    return apiData(data, { page, limit, total });
  } catch (error) {
    console.error("[api/v2/organizations]", error);
    return apiError("CATALOG_UNAVAILABLE", "Organization data is temporarily unavailable", 503);
  }
}
