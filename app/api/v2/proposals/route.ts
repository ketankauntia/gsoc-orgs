import { apiData, apiError, pagination } from "@/lib/api-response";
import { getApprovedProposals } from "@/lib/proposals/queries";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { page, limit } = pagination(url.searchParams);
    const year = Number.parseInt(url.searchParams.get("year") ?? "", 10);
    const result = await getApprovedProposals({
      q: url.searchParams.get("q")?.trim().slice(0, 80) || undefined,
      organization: url.searchParams.get("organization")?.trim() || undefined,
      project: url.searchParams.get("project")?.trim() || undefined,
      year: Number.isFinite(year) ? year : undefined,
      page,
      limit,
    });
    return apiData(result.data, { page: result.page, limit: result.limit, total: result.total }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  } catch (error) {
    console.error("[api/v2/proposals]", error);
    return apiError("PROPOSALS_UNAVAILABLE", "Proposals are temporarily unavailable", 503);
  }
}
