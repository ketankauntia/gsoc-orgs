import { apiError, privateApiData } from "@/lib/api-response";
import { getUser } from "@/lib/auth";
import { proposalPatchSchema, zodFields } from "@/lib/proposals/schemas";
import { createClient } from "@/lib/supabase/server";
import { deleteR2Object } from "@/lib/r2";
import { isTrustedMutationRequest, publicDatabaseMessage, readJsonBody } from "@/lib/security";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutationRequest(request)) return apiError("CROSS_SITE_REQUEST", "Cross-site requests are not allowed", 403);
  const user = await getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in is required", 401);
  const parsed = proposalPatchSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Check the supplied evidence", 422, zodFields(parsed.error));
  const { id } = await params;
  const supabase = await createClient();
  const { error: updateError } = await supabase.rpc("update_my_proposal_evidence", {
    target_proposal_id: id,
    private_note: parsed.data.claimantNote ?? "",
    private_evidence_urls: parsed.data.evidenceUrls ?? [],
    should_update_note: "claimantNote" in parsed.data,
    should_update_evidence: "evidenceUrls" in parsed.data,
  });
  if (updateError) return apiError("PROPOSAL_UPDATE_FAILED", "Proposal could not be updated", 500);
  return privateApiData({ updated: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutationRequest(request)) return apiError("CROSS_SITE_REQUEST", "Cross-site requests are not allowed", 403);
  const user = await getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in is required", 401);
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("delete_my_draft", { target_proposal_id: id });
  if (error) return apiError("PROPOSAL_DELETE_FAILED", publicDatabaseMessage(error.message, "The proposal cannot be deleted in its current state"), 409);
  const result = data as { action: "deleted" | "withdrawn"; file_keys?: string[] };
  if (result.action === "deleted" && result.file_keys?.length) {
    await Promise.all(result.file_keys.map((fileKey) => deleteR2Object(fileKey))).catch((storageError) => {
      console.error("Failed to delete draft PDF from R2", storageError);
    });
  }
  return privateApiData({ action: result.action });
}
