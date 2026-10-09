import { apiData, apiError } from "@/lib/api-response";
import { PROJECT_PEOPLE } from "@/lib/catalog/sql";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ externalId: string }> }) {
  try {
    const { externalId } = await params;
    const rows = await db().query(
      `select p.id, p.external_id, p.year, p.title, p.abstract_short, p.info_html, p.project_url, p.code_url, p.work_product_url, p.work_product_kind,
         p.source_created_at, p.source_updated_at, p.created_at, p.updated_at,
         jsonb_build_object('id', o.id, 'slug', o.slug::text, 'name', o.name, 'logo_r2_url', o.logo_r2_url) as organizations,
         ${PROJECT_PEOPLE},
         coalesce((select jsonb_agg(jsonb_build_object('technologies', jsonb_build_object('id', t.id, 'slug', t.slug::text, 'name', t.name)) order by t.name)
           from public.project_technologies pt join public.technologies t on t.id = pt.technology_id where pt.project_id = p.id), '[]'::jsonb) as project_technologies
       from public.projects p join public.organizations o on o.id = p.organization_id
       where p.external_id = $1`,
      [externalId.slice(0, 200)],
    );
    if (!rows[0]) return apiError("NOT_FOUND", "Project not found", 404);
    return apiData(rows[0]);
  } catch (error) {
    console.error("[api/v2/projects/:id]", error);
    return apiError("CATALOG_UNAVAILABLE", "Project data is temporarily unavailable", 503);
  }
}
