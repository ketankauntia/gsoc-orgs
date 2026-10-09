import { apiError, privateApiData } from "@/lib/api-response";
import { apiAdmin, databaseErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { startUploadSchema, zodFields } from "@/lib/hub/schemas";
import { uploadTarget } from "@/lib/hub/upload";
import { readJsonBody } from "@/lib/security";

/** Admin upload for a contributor slot: creates the proposal if needed and returns a signed upload URL. */
export async function POST(request: Request) {
  const gate = await apiAdmin(request);
  if (gate.response) return gate.response;
  const parsed = startUploadSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Choose a contributor", 422, zodFields(parsed.error));
  try {
    const rows = await db()`select public.admin_start_proposal_upload(${gate.viewer.user.id}::uuid, ${parsed.data.personId}::uuid) as id`;
    return privateApiData(await uploadTarget(rows[0].id as string), undefined, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/admin/proposals");
  }
}
