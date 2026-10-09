import { apiError, privateApiData } from "@/lib/api-response";
import { apiAdmin, databaseErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { contributorWorkPaths, revalidateContributorWork, revalidatePaths } from "@/lib/hub/revalidate";
import { adminPermissionSchema, completeUploadSchema, confirmSchema, reasonSchema, zodFields } from "@/lib/hub/schemas";
import { deleteR2Object, isQuarantineKeyFor } from "@/lib/r2";
import { readJsonBody } from "@/lib/security";

type Context = { params: Promise<{ id: string; action: string }> };

/**
 * abandon    – the browser could not upload the file; end the reservation
 * permission – record the author's permission for an admin upload
 * confirm    – personal details are removed from this exact file
 * publish    – publish a draft (needs a checked file, consent or permission, confirmed redaction)
 * remove     – delete the file and lock the proposal
 */
export async function POST(request: Request, { params }: Context) {
  const gate = await apiAdmin(request);
  if (gate.response) return gate.response;
  const { id, action } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError("NOT_FOUND", "Proposal not found", 404);
  const body = await readJsonBody(request).catch(() => null);
  const adminId = gate.viewer.user.id;
  try {
    if (action === "abandon") {
      const parsed = completeUploadSchema.safeParse(body);
      if (!parsed.success || !isQuarantineKeyFor(parsed.data.key, id)) return apiError("INVALID_UPLOAD", "This upload does not belong to the proposal", 422);
      await db()`select public.admin_abandon_proposal_upload(${adminId}::uuid, ${id}::uuid)`;
      await deleteR2Object(parsed.data.key).catch((error) => console.warn("[admin/proposals:abandon-delete]", error));
      return privateApiData({ abandoned: true });
    }
    if (action === "permission") {
      const parsed = adminPermissionSchema.safeParse(body);
      if (!parsed.success) return apiError("VALIDATION_ERROR", "Check the permission details", 422, zodFields(parsed.error));
      const { basis, note, sourceUrl, givenAt } = parsed.data;
      await db()`select public.admin_set_proposal_permission(${adminId}::uuid, ${id}::uuid, ${basis}, ${note}, ${sourceUrl}, ${givenAt}::date, null)`;
      // A published proposal without a verified owner is public only with a recorded permission.
      await revalidateContributorWork({ proposalId: id });
      return privateApiData({ saved: true });
    }
    if (action === "confirm") {
      const parsed = confirmSchema.safeParse(body);
      if (!parsed.success) return apiError("VALIDATION_ERROR", "Reload and check the file again", 422, zodFields(parsed.error));
      await db()`select public.confirm_proposal_redaction(${adminId}::uuid, true, ${id}::uuid, ${parsed.data.sha256})`;
      return privateApiData({ confirmed: true });
    }
    if (action === "publish") {
      await db()`select public.admin_publish_proposal(${adminId}::uuid, ${id}::uuid)`;
      await revalidateContributorWork({ proposalId: id });
      return privateApiData({ published: true });
    }
    if (action === "remove") {
      const parsed = reasonSchema.safeParse(body);
      if (!parsed.success) return apiError("VALIDATION_ERROR", "Give a reason", 422, zodFields(parsed.error));
      const paths = await contributorWorkPaths({ proposalId: id });
      const rows = await db()`select public.admin_remove_proposal(${adminId}::uuid, ${id}::uuid, ${parsed.data.reason}) as key`;
      const key = rows[0]?.key as string | null;
      if (key) await deleteR2Object(key).catch((error) => console.error("[admin/proposals:remove-object]", error));
      revalidatePaths(paths);
      return privateApiData({ removed: true });
    }
    return apiError("NOT_FOUND", "Unknown action", 404);
  } catch (error) {
    return databaseErrorResponse(error, `api/v2/admin/proposals/[id]/${action}`);
  }
}
