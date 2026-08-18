import { randomUUID } from "node:crypto";
import { apiError, privateApiData } from "@/lib/api-response";
import { authorizeAdminMutationApi } from "@/lib/admin-api";
import { uploadCompleteSchema, zodFields } from "@/lib/proposals/schemas";
import { deleteR2Object, promotePdf, validateQuarantinedPdf } from "@/lib/r2";
import { readJsonBody } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminMutationApi(request);
  if ("response" in auth) return auth.response;
  const parsed = uploadCompleteSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Upload completion data is invalid", 422, zodFields(parsed.error));
  const { id } = await params;
  const expectedPrefix = `quarantine/${auth.user.id}/`;
  if (!parsed.data.key.startsWith(expectedPrefix) || !parsed.data.key.endsWith(".pdf")) return apiError("INVALID_UPLOAD_KEY", "Upload key is invalid", 403);
  const fileId = randomUUID();
  let promotedKey: string | undefined;
  let validated: Awaited<ReturnType<typeof validateQuarantinedPdf>>;
  try {
    validated = await validateQuarantinedPdf(parsed.data.key);
    promotedKey = await promotePdf(parsed.data.key, `admin-${id}`, fileId, validated.bytes);
  } catch (error) {
    if (promotedKey) await deleteR2Object(promotedKey).catch(() => undefined);
    else await deleteR2Object(parsed.data.key).catch(() => undefined);
    console.error("[admin proposal import:validation]", error);
    return apiError("INVALID_PDF", "The upload is not a valid, parseable PDF of 10 MiB or less", 422);
  }
  const { error } = await createAdminClient().rpc("publish_admin_proposal_import", {
    target_admin_id: auth.user.id,
    target_import_id: id,
    new_file_id: fileId,
    new_r2_key: promotedKey,
    new_original_filename: parsed.data.filename,
    new_byte_size: validated.byteSize,
    new_sha256: validated.sha256,
    new_etag: validated.etag ?? undefined,
  });
  if (error) {
    await deleteR2Object(promotedKey).catch(() => undefined);
    console.error("[admin proposal import:publish]", error);
    return apiError("IMPORT_PUBLISH_FAILED", "The validated PDF could not be published", 409);
  }
  return privateApiData({ id, status: "published", fileId, byteSize: validated.byteSize, sha256: validated.sha256, pageCount: validated.pageCount });
}
