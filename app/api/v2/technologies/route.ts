import { apiData, apiError, pagination } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { page, limit, from, to } = pagination(new URL(request.url).searchParams);
    const { data, error, count } = await createAdminClient().from("technologies").select("id,slug,name", { count: "exact" }).order("name").range(from, to);
    if (error) throw error;
    return apiData(data ?? [], { page, limit, total: count ?? 0 });
  } catch (error) {
    console.error("[api/v2/technologies]", error);
    return apiError("CATALOG_UNAVAILABLE", "Technology data is temporarily unavailable", 503);
  }
}
