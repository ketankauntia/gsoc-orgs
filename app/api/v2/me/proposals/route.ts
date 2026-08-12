import { apiError, privateApiData } from "@/lib/api-response";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTrustedMutationRequest, readJsonBody } from "@/lib/security";

export async function GET() {
  const user = await getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in is required", 401);
  try {
    const { data, error } = await createAdminClient()
      .from("proposals")
      .select("id,public_slug,status,moderator_reason,submitted_at,reviewed_at,created_at,current_file_id,contributor_claims!inner(id,status,year,claimant_note,evidence_urls,project_contributors!inner(id,archived_name,projects!inner(external_id,title,year,organizations!inner(slug,name)))),proposal_files(id,version,original_filename,byte_size,sha256,validation_status,created_at)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return privateApiData(data ?? []);
  } catch (error) {
    console.error("[api/v2/me/proposals]", error);
    return apiError("PROPOSALS_UNAVAILABLE", "Your proposals are temporarily unavailable", 503);
  }
}

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) return apiError("CROSS_SITE_REQUEST", "Cross-site requests are not allowed", 403);
  const user = await getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in is required", 401);
  const body = await readJsonBody(request).catch(() => null) as { claimId?: unknown } | null;
  const claimId = body?.claimId;
  if (typeof claimId !== "string") return apiError("VALIDATION_ERROR", "claimId is required", 422);
  const { data, error } = await createAdminClient().from("proposals").select("id,public_slug,status").eq("claim_id", claimId).eq("user_id", user.id).maybeSingle();
  if (error) return apiError("PROPOSAL_UNAVAILABLE", "Proposal could not be loaded", 500);
  if (!data) return apiError("NOT_FOUND", "Claim not found", 404);
  return privateApiData(data);
}
