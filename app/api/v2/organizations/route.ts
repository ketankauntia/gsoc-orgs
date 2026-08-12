import { apiData, apiError, pagination } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { page, limit, from, to } = pagination(url.searchParams);
    const q = url.searchParams.get("q")?.trim().slice(0, 80);
    const year = Number.parseInt(url.searchParams.get("year") ?? "", 10);
    const active = url.searchParams.get("active");
    let query = createAdminClient()
      .from("organizations")
      .select("id,canonical_id,slug,name,category,description,website,image_url,logo_r2_url,active_years,first_year,last_year,is_currently_active,total_projects,updated_at", { count: "exact" })
      .order("name")
      .range(from, to);
    if (q) query = query.ilike("name", `%${q.replaceAll("%", "")}%`);
    if (Number.isFinite(year)) query = query.contains("active_years", [year]);
    if (active === "true" || active === "false") query = query.eq("is_currently_active", active === "true");
    const { data, error, count } = await query;
    if (error) throw error;
    return apiData(data ?? [], { page, limit, total: count ?? 0 });
  } catch (error) {
    console.error("[api/v2/organizations]", error);
    return apiError("CATALOG_UNAVAILABLE", "Organization data is temporarily unavailable", 503);
  }
}
