import { apiData, apiError } from "@/lib/api-response";
import { getApprovedProposal } from "@/lib/proposals/queries";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const proposal = await getApprovedProposal(slug.slice(0, 200));
    if (!proposal) return apiError("NOT_FOUND", "Proposal not found", 404);
    return apiData(proposal);
  } catch (error) {
    console.error("[api/v2/proposals/:slug]", error);
    return apiError("PROPOSALS_UNAVAILABLE", "Proposal is temporarily unavailable", 503);
  }
}
