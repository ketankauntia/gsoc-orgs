import { apiData, apiError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ externalId: string }> }) {
  try {
    const { externalId } = await params;
    const { data, error } = await createAdminClient()
      .from("projects")
      .select("id,external_id,year,title,abstract_short,info_html,project_url,code_url,source_created_at,source_updated_at,created_at,updated_at,organizations(id,slug,name,logo_r2_url),project_contributors(id,archived_name,archived_profile_url,ordinal),project_mentors(name,ordinal),project_technologies(technologies(id,slug,name))")
      .eq("external_id", externalId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return apiError("NOT_FOUND", "Project not found", 404);
    return apiData(data);
  } catch (error) {
    console.error("[api/v2/projects/:id]", error);
    return apiError("CATALOG_UNAVAILABLE", "Project data is temporarily unavailable", 503);
  }
}
