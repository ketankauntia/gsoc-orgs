import { apiData, apiError, pagination } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { page, limit, from, to } = pagination(url.searchParams);
    const q = url.searchParams.get("q")?.trim().slice(0, 80);
    const organization = url.searchParams.get("organization")?.trim();
    const project = url.searchParams.get("project")?.trim();
    const year = Number.parseInt(url.searchParams.get("year") ?? "", 10);
    let query = createAdminClient().from("approved_proposals").select("*", { count: "exact" }).order("approved_at", { ascending: false }).range(from, to);
    if (q) query = query.ilike("project_title", `%${q.replaceAll("%", "")}%`);
    if (organization) query = query.eq("organization_slug", organization);
    if (project) query = query.eq("project_external_id", project);
    if (Number.isFinite(year)) query = query.eq("year", year);
    const { data, error, count } = await query;
    if (error) throw error;
    return apiData(data ?? [], { page, limit, total: count ?? 0 });
  } catch (error) {
    console.error("[api/v2/proposals]", error);
    return apiError("PROPOSALS_UNAVAILABLE", "Approved proposals are temporarily unavailable", 503);
  }
}
