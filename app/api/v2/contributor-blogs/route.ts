import { apiData, apiError } from "@/lib/api-response";
import { getContributorBlogs } from "@/lib/contributor-blogs";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const year = Number.parseInt(params.get("year") ?? "", 10);
    const organization = params.get("organization")?.trim().slice(0, 100) || undefined;
    const data = await getContributorBlogs({ year: Number.isFinite(year) ? year : undefined, organization });
    return apiData(data, { total: data.length }, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
  } catch (error) {
    console.error("[api/v2/contributor-blogs]", error);
    return apiError("BLOGS_UNAVAILABLE", "Contributor blogs are temporarily unavailable", 503);
  }
}
