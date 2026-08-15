import { randomUUID } from "node:crypto";
import { apiError, privateApiData } from "@/lib/api-response";
import { consumeRateLimit, getUser } from "@/lib/auth";
import { uploadCompleteSchema, zodFields } from "@/lib/proposals/schemas";
import { deleteR2Object, promotePdf, validateQuarantinedPdf } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTrustedMutationRequest, readJsonBody } from "@/lib/security";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutationRequest(request)) return apiError("CROSS_SITE_REQUEST", "Cross-site requests are not allowed", 403);
  const user = await getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in is required", 401);
  const parsed = uploadCompleteSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Upload completion data is invalid", 422, zodFields(parsed.error));
  const { id } = await params;
  const expectedPrefix = `quarantine/${user.id}/`;
  if (!parsed.data.key.startsWith(expectedPrefix) || !parsed.data.key.endsWith(".pdf")) return apiError("INVALID_UPLOAD_KEY", "Upload key is invalid", 403);
  try {
    if (!(await consumeRateLimit("upload_complete"))) return apiError("RATE_LIMITED", "Too many upload attempts; try again later", 429);
  } catch (error) {
    console.error("[proposal upload-complete:rate-limit]", error);
    return apiError("UPLOAD_UNAVAILABLE", "Upload validation is temporarily unavailable", 503);
  }

  const fileId = randomUUID();
  let promotedKey: string | undefined;
  let validated: Awaited<ReturnType<typeof validateQuarantinedPdf>>;
  try {
    validated = await validateQuarantinedPdf(parsed.data.key);
    promotedKey = await promotePdf(parsed.data.key, id, fileId, validated.bytes);
  } catch (error) {
    if (promotedKey) await deleteR2Object(promotedKey).catch(() => undefined);
    else await deleteR2Object(parsed.data.key).catch(() => undefined);
    console.error("[proposal upload-complete:validation]", error);
    return apiError("INVALID_PDF", "The upload is not a valid, parseable PDF of 10 MiB or less", 422);
  }

  const { data: previousKey, error } = await createAdminClient().rpc("attach_proposal_file", {
    target_user_id: user.id,
    target_proposal_id: id,
    new_file_id: fileId,
    new_r2_key: promotedKey,
    new_original_filename: parsed.data.filename,
    new_byte_size: validated.byteSize,
    new_sha256: validated.sha256,
    new_etag: validated.etag ?? undefined,
  });
  if (error) {
    await deleteR2Object(promotedKey).catch(() => undefined);
    console.error("[proposal upload-complete:attach]", error);
    return apiError("UPLOAD_ATTACH_FAILED", "The PDF could not be attached to this editable proposal", 409);
  }
  if (typeof previousKey === "string" && previousKey) await deleteR2Object(previousKey).catch(() => undefined);
  return privateApiData({ fileId, byteSize: validated.byteSize, sha256: validated.sha256, pageCount: validated.pageCount });
}
