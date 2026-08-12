import { apiData, apiError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { data, error } = await createAdminClient().from("approved_proposals").select("*").eq("public_slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return apiError("NOT_FOUND", "Approved proposal not found", 404);
    return apiData(data);
  } catch (error) {
    console.error("[api/v2/proposals/:slug]", error);
    return apiError("PROPOSALS_UNAVAILABLE", "Proposal is temporarily unavailable", 503);
  }
}
