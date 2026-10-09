import { apiData, apiError, pagination } from "@/lib/api-response";
import { pageOf } from "@/lib/catalog/sql";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { page, limit, from } = pagination(new URL(request.url).searchParams);
    const rows = await db()`select id, slug::text as slug, name, count(*) over () as total_count from public.technologies order by name limit ${limit} offset ${from}`;
    const { total, data } = pageOf(rows);
    return apiData(data, { page, limit, total });
  } catch (error) {
    console.error("[api/v2/technologies]", error);
    return apiError("CATALOG_UNAVAILABLE", "Technology data is temporarily unavailable", 503);
  }
}
