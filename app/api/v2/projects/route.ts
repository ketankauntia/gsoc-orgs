import { apiData, apiError, pagination } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { page, limit, from, to } = pagination(url.searchParams);
    const q = url.searchParams.get("q")?.trim().slice(0, 80);
    const organization = url.searchParams.get("organization")?.trim();
    const year = Number.parseInt(url.searchParams.get("year") ?? "", 10);
    let query = createAdminClient()
      .from("projects")
      .select("id,external_id,year,title,abstract_short,project_url,code_url,organizations!inner(slug,name),project_contributors(id,archived_name,archived_profile_url,ordinal),project_mentors(name,ordinal)", { count: "exact" })
      .order("title")
      .range(from, to);
    if (q) query = query.ilike("title", `%${q.replaceAll("%", "")}%`);
    if (Number.isFinite(year)) query = query.eq("year", year);
    if (organization) query = query.eq("organizations.slug", organization);
    const { data, error, count } = await query;
    if (error) throw error;
    return apiData(data ?? [], { page, limit, total: count ?? 0 });
  } catch (error) {
    console.error("[api/v2/projects]", error);
    return apiError("CATALOG_UNAVAILABLE", "Project data is temporarily unavailable", 503);
  }
}
