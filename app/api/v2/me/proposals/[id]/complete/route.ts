import { apiError, privateApiData } from "@/lib/api-response";
import { apiViewer, databaseErrorResponse } from "@/lib/api-auth";
import { completeUploadSchema, zodFields } from "@/lib/hub/schemas";
import { revalidateContributorWork } from "@/lib/hub/revalidate";
import { completeProposalUpload, UploadRejected } from "@/lib/hub/upload";
import { readJsonBody } from "@/lib/security";

export const maxDuration = 60;

/** Validates the uploaded PDF, scans it for personal data and makes it the proposal's file. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await apiViewer(request);
  if (gate.response) return gate.response;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError("NOT_FOUND", "Proposal not found", 404);
  const parsed = completeUploadSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Upload again", 422, zodFields(parsed.error));
  try {
    const result = await completeProposalUpload({ actorId: gate.viewer.user.id, isAdmin: false, proposalId: id, key: parsed.data.key });
    // A new file takes a published proposal back to draft until it is published again.
    await revalidateContributorWork({ proposalId: id });
    return privateApiData(result);
  } catch (error) {
    if (error instanceof UploadRejected) return apiError("INVALID_UPLOAD", error.message, 422);
    return databaseErrorResponse(error, "api/v2/me/proposals/[id]/complete");
  }
}
