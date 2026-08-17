import { apiData, apiError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { data, error } = await createAdminClient()
      .from("organizations")
      .select("id,canonical_id,slug,name,category,description,website,contact,socials,image_url,image_background_color,logo_r2_url,active_years,first_year,last_year,first_time,is_currently_active,total_projects,created_at,updated_at,organization_years(year,project_count,archive_url,selection_status,withdrawn_at),organization_technologies(technologies(id,slug,name)),organization_topics(topics(id,slug,name))")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return apiError("NOT_FOUND", "Organization not found", 404);
    return apiData(data);
  } catch (error) {
    console.error("[api/v2/organizations/:slug]", error);
    return apiError("CATALOG_UNAVAILABLE", "Organization data is temporarily unavailable", 503);
  }
}
