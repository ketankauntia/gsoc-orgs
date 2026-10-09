import { apiError, privateApiData } from "@/lib/api-response";
import { apiAdmin, databaseErrorResponse } from "@/lib/api-auth";
import { completeUploadSchema, zodFields } from "@/lib/hub/schemas";
import { completeProposalUpload, UploadRejected } from "@/lib/hub/upload";
import { readJsonBody } from "@/lib/security";

export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await apiAdmin(request);
  if (gate.response) return gate.response;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError("NOT_FOUND", "Proposal not found", 404);
  const parsed = completeUploadSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Upload again", 422, zodFields(parsed.error));
  try {
    return privateApiData(await completeProposalUpload({ actorId: gate.viewer.user.id, isAdmin: true, proposalId: id, key: parsed.data.key }));
  } catch (error) {
    if (error instanceof UploadRejected) return apiError("INVALID_UPLOAD", error.message, 422);
    return databaseErrorResponse(error, "api/v2/admin/proposals/[id]/complete");
  }
}
