import { apiData, apiError, pagination } from "@/lib/api-response";
import { likeTerm, pageOf, PROJECT_WITH_PEOPLE } from "@/lib/catalog/sql";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { page, limit, from } = pagination(url.searchParams);
    const year = Number.parseInt(url.searchParams.get("year") ?? "", 10);
    const rows = await db().query(
      `select p.id, p.external_id, p.year, p.title, p.abstract_short, p.project_url, p.code_url, p.work_product_url, p.work_product_kind,
         ${PROJECT_WITH_PEOPLE}, count(*) over () as total_count
       from public.projects p join public.organizations o on o.id = p.organization_id
       where ($1::text is null or p.title ilike '%' || $1 || '%')
         and ($2::int is null or p.year = $2)
         and ($3::text is null or o.slug = $3::citext)
       order by p.title
       limit $4 offset $5`,
      [likeTerm(url.searchParams.get("q")), Number.isFinite(year) ? year : null, url.searchParams.get("organization")?.trim() || null, limit, from],
    );
    const { total, data } = pageOf(rows);
    return apiData(data, { page, limit, total });
  } catch (error) {
    console.error("[api/v2/projects]", error);
    return apiError("CATALOG_UNAVAILABLE", "Project data is temporarily unavailable", 503);
  }
}
