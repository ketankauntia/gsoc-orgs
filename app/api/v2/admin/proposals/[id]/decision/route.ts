import { apiError, privateApiData } from "@/lib/api-response";
import { getUser, getUserRoles } from "@/lib/auth";
import { moderationDecisionSchema, zodFields } from "@/lib/proposals/schemas";
import { createClient } from "@/lib/supabase/server";
import { isTrustedMutationRequest, publicDatabaseMessage, readJsonBody } from "@/lib/security";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutationRequest(request)) return apiError("CROSS_SITE_REQUEST", "Cross-site requests are not allowed", 403);
  const user = await getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in is required", 401);
  const roles = await getUserRoles(user.id);
  if (!roles.some((role) => role === "moderator" || role === "admin")) return apiError("FORBIDDEN", "Moderator access is required", 403);
  const parsed = moderationDecisionSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Check the moderation decision", 422, zodFields(parsed.error));
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.rpc("moderate_proposal", { target_proposal_id: id, decision: parsed.data.decision, decision_reason: parsed.data.reason ?? undefined });
  if (error) return apiError("DECISION_REJECTED", publicDatabaseMessage(error.message, "This moderation decision is not valid for the current state"), 409);
  return privateApiData({ updated: true, decision: parsed.data.decision });
}
