import { apiError, privateApiData } from "@/lib/api-response";
import { consumeRateLimit, getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTrustedMutationRequest, publicDatabaseMessage, readJsonBody } from "@/lib/security";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutationRequest(request)) return apiError("CROSS_SITE_REQUEST", "Cross-site requests are not allowed", 403);
  const user = await getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in is required", 401);
  const body = await readJsonBody(request).catch(() => null) as { acceptCcBy4?: unknown; confirmOwnership?: unknown } | null;
  if (body?.acceptCcBy4 !== true || body?.confirmOwnership !== true) return apiError("LICENSE_CONSENT_REQUIRED", "Ownership confirmation and CC BY 4.0 consent are required", 422);
  const { id } = await params;
  try {
    if (!(await consumeRateLimit("submit_proposal"))) return apiError("RATE_LIMITED", "Too many submission attempts; try again later", 429);
    const { error } = await createAdminClient().rpc("submit_my_proposal", { target_user_id: user.id, target_proposal_id: id });
    if (error) return apiError("SUBMISSION_REJECTED", publicDatabaseMessage(error.message, "The proposal is not ready to submit"), 409);
    return privateApiData({ submitted: true, status: "pending" });
  } catch (error) {
    console.error("[proposal submit]", error);
    return apiError("SUBMISSION_UNAVAILABLE", "Proposal submission is temporarily unavailable", 503);
  }
}
