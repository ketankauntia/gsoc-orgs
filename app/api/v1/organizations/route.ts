import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { organizationV1 } from "@/lib/supabase/legacy-shapes";
import { canonicalTechnology } from "@/lib/vocabulary/catalog";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page")) || 1);
    const limit = Math.min(100, Number(params.get("limit")) || 20);
    const q = params.get("q")?.slice(0, 80); const category = params.get("category"); const technology = params.get("technology"); const year = Number(params.get("year")); const active = params.get("active"); const sort = params.get("sort") ?? "name";
    const admin = createAdminClient();
    let query = admin.from("organizations").select("*", { count: "exact" }).range((page - 1) * limit, page * limit - 1);
    if (q) query = query.or(`name.ilike.%${q.replaceAll("%", "")}%,description.ilike.%${q.replaceAll("%", "")}%`);
    if (category) query = query.eq("category", category);
    if (Number.isFinite(year) && year > 0) query = query.contains("active_years", [year]);
    if (active === "true" || active === "false") query = query.eq("is_currently_active", active === "true");
    if (technology) {
      const canonicalSlug = canonicalTechnology(technology).slug;
      const { data: taxonomy, error: taxonomyError } = await admin.from("technologies").select("id").eq("slug", canonicalSlug).maybeSingle();
      if (taxonomyError) throw taxonomyError;
      if (!taxonomy) return NextResponse.json({ success: true, data: { organizations: [], pagination: { page, limit, total: 0, pages: 0 } }, meta: { timestamp: new Date().toISOString(), version: "v1" } });
      const { data: joins, error: joinsError } = await admin.from("organization_technologies").select("organization_id").eq("technology_id", taxonomy.id);
      if (joinsError) throw joinsError;
      const organizationIds = (joins ?? []).map((join) => join.organization_id);
      if (!organizationIds.length) return NextResponse.json({ success: true, data: { organizations: [], pagination: { page, limit, total: 0, pages: 0 } }, meta: { timestamp: new Date().toISOString(), version: "v1" } });
      query = query.in("id", organizationIds);
    }
    query = sort === "projects" ? query.order("total_projects", { ascending: false }) : sort === "year" ? query.order("first_year", { ascending: false }) : query.order("name");
    const { data, count, error } = await query; if (error) throw error;
    return NextResponse.json({ success: true, data: { organizations: (data ?? []).map(organizationV1), pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) } }, meta: { timestamp: new Date().toISOString(), version: "v1" } }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (error) { console.error("Organizations API error:", error); return NextResponse.json({ success: false, error: { message: "Failed to fetch organizations", code: "FETCH_ERROR" } }, { status: 500 }); }
}
