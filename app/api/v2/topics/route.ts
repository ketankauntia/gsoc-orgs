import { apiData, apiError, pagination } from "@/lib/api-response";
import { pageOf } from "@/lib/catalog/sql";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { page, limit, from } = pagination(new URL(request.url).searchParams);
    const { total, data } = await pageOf((take, skip) => db()`select id, slug::text as slug, name, count(*) over () as total_count from public.topics order by name limit ${take} offset ${skip}`, limit, from);
    return apiData(data, { page, limit, total });
  } catch (error) {
    console.error("[api/v2/topics]", error);
    return apiError("CATALOG_UNAVAILABLE", "Topic data is temporarily unavailable", 503);
  }
}
