import { apiError, privateApiData } from "@/lib/api-response";
import { getUser } from "@/lib/auth";
import { createClaimSchema, zodFields } from "@/lib/proposals/schemas";
import { createClient } from "@/lib/supabase/server";
import { isTrustedMutationRequest, publicDatabaseMessage, readJsonBody } from "@/lib/security";

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) return apiError("CROSS_SITE_REQUEST", "Cross-site requests are not allowed", 403);
  const user = await getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in is required", 401);
  const parsed = createClaimSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Check your claim details", 422, zodFields(parsed.error));
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_contributor_claim", {
      contributor_slot_id: parsed.data.contributorSlotId,
      private_note: parsed.data.claimantNote ?? undefined,
      private_evidence_urls: parsed.data.evidenceUrls,
    });
    if (error) {
      if (/rate limit/i.test(error.message)) return apiError("RATE_LIMITED", "Too many claim attempts; try again later", 429);
      const conflict = /two active|duplicate|unique|year/i.test(error.message);
      return apiError("CLAIM_NOT_AVAILABLE", publicDatabaseMessage(error.message, "This claim is not available"), conflict ? 409 : 422);
    }
    return privateApiData({ claimId: data }, undefined, { status: 201 });
  } catch (error) {
    console.error("[api/v2/me/claims]", error);
    return apiError("CLAIM_CREATE_FAILED", "The contributor claim could not be created", 500);
  }
}
