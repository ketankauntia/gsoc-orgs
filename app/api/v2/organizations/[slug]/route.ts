import { apiData, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const rows = await db().query(
      `select o.id, o.canonical_id, o.slug::text as slug, o.name, o.category, o.description, o.website, o.contact, o.socials,
         o.image_url, o.image_background_color, o.logo_r2_url, o.active_years, o.first_year, o.last_year, o.first_time,
         o.is_currently_active, o.total_projects, o.created_at, o.updated_at,
         coalesce((select jsonb_agg(jsonb_build_object('year', oy.year, 'project_count', oy.project_count, 'archive_url', oy.archive_url,
           'selection_status', oy.selection_status, 'withdrawn_at', oy.withdrawn_at) order by oy.year)
           from public.organization_years oy where oy.organization_id = o.id), '[]'::jsonb) as organization_years,
         coalesce((select jsonb_agg(jsonb_build_object('technologies', jsonb_build_object('id', t.id, 'slug', t.slug::text, 'name', t.name)) order by t.name)
           from public.organization_technologies ot join public.technologies t on t.id = ot.technology_id where ot.organization_id = o.id), '[]'::jsonb) as organization_technologies,
         coalesce((select jsonb_agg(jsonb_build_object('topics', jsonb_build_object('id', tp.id, 'slug', tp.slug::text, 'name', tp.name)) order by tp.name)
           from public.organization_topics otp join public.topics tp on tp.id = otp.topic_id where otp.organization_id = o.id), '[]'::jsonb) as organization_topics
       from public.organizations o where o.slug = $1::citext`,
      [slug.slice(0, 120)],
    );
    if (!rows[0]) return apiError("NOT_FOUND", "Organization not found", 404);
    return apiData(rows[0]);
  } catch (error) {
    console.error("[api/v2/organizations/:slug]", error);
    return apiError("CATALOG_UNAVAILABLE", "Organization data is temporarily unavailable", 503);
  }
}
