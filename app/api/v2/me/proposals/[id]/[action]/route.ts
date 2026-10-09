import { apiError, privateApiData } from "@/lib/api-response";
import { apiViewer, databaseErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { revalidateContributorWork } from "@/lib/hub/revalidate";
import { completeUploadSchema, confirmSchema, finalizeSchema, reasonSchema, zodFields } from "@/lib/hub/schemas";
import { TERMS_VERSION } from "@/lib/hub/types";
import { deleteR2Object, isQuarantineKeyFor } from "@/lib/r2";
import { readJsonBody } from "@/lib/security";

type Context = { params: Promise<{ id: string; action: string }> };

/**
 * abandon  – the browser could not upload the file; end the reservation
 * confirm  – the author checked this exact file for personal details
 * finalize – publish under CC BY 4.0; afterwards only the admin can change it
 * removal  – ask the admin to take the file down, final or not
 */
export async function POST(request: Request, { params }: Context) {
  const gate = await apiViewer(request);
  if (gate.response) return gate.response;
  const { id, action } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError("NOT_FOUND", "Proposal not found", 404);
  const body = await readJsonBody(request).catch(() => null);
  const userId = gate.viewer.user.id;
  try {
    if (action === "abandon") {
      const parsed = completeUploadSchema.safeParse(body);
      if (!parsed.success || !isQuarantineKeyFor(parsed.data.key, id)) return apiError("INVALID_UPLOAD", "This upload does not belong to the proposal", 422);
      await db()`select public.abandon_my_proposal_upload(${userId}::uuid, ${id}::uuid)`;
      await deleteR2Object(parsed.data.key).catch((error) => console.warn("[me/proposals:abandon-delete]", error));
      return privateApiData({ abandoned: true });
    }
    if (action === "confirm") {
      const parsed = confirmSchema.safeParse(body);
      if (!parsed.success) return apiError("VALIDATION_ERROR", "Reload and check the file again", 422, zodFields(parsed.error));
      await db()`select public.confirm_proposal_redaction(${userId}::uuid, false, ${id}::uuid, ${parsed.data.sha256})`;
      return privateApiData({ confirmed: true });
    }
    if (action === "finalize") {
      const parsed = finalizeSchema.safeParse(body);
      if (!parsed.success) return apiError("VALIDATION_ERROR", "Accept the terms to publish", 422, zodFields(parsed.error));
      await db()`select public.finalize_my_proposal(${userId}::uuid, ${id}::uuid, ${TERMS_VERSION})`;
      await revalidateContributorWork({ proposalId: id });
      return privateApiData({ published: true });
    }
    if (action === "removal") {
      const parsed = reasonSchema.safeParse(body);
      if (!parsed.success) return apiError("VALIDATION_ERROR", "Tell us why", 422, zodFields(parsed.error));
      await db()`select public.request_proposal_removal(${userId}::uuid, ${id}::uuid, ${parsed.data.reason})`;
      return privateApiData({ requested: true });
    }
    return apiError("NOT_FOUND", "Unknown action", 404);
  } catch (error) {
    return databaseErrorResponse(error, `api/v2/me/proposals/[id]/${action}`);
  }
}
