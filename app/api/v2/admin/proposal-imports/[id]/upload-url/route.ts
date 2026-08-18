import { apiError, privateApiData } from "@/lib/api-response";
import { authorizeAdminMutationApi } from "@/lib/admin-api";
import { uploadRequestSchema, zodFields } from "@/lib/proposals/schemas";
import { createPdfUploadUrl, newQuarantineKey, PROPOSAL_PDF_MIME } from "@/lib/r2";
import { readJsonBody } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminMutationApi(request);
  if ("response" in auth) return auth.response;
  const parsed = uploadRequestSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Only PDF files up to 10 MiB are accepted", 422, zodFields(parsed.error));
  const { id } = await params;
  const { data, error } = await createAdminClient().from("admin_proposal_imports").select("id").eq("id", id).eq("status", "draft").eq("imported_by", auth.user.id).maybeSingle();
  if (error) return apiError("UPLOAD_UNAVAILABLE", "Upload could not be started", 503);
  if (!data) return apiError("NOT_FOUND", "Editable proposal import not found", 404);
  try {
    const key = newQuarantineKey(auth.user.id);
    return privateApiData({ key, uploadUrl: await createPdfUploadUrl(key), expiresIn: 600, headers: { "Content-Type": PROPOSAL_PDF_MIME } });
  } catch (error) {
    console.error("[admin proposal import:upload-url]", error);
    return apiError("UPLOAD_UNAVAILABLE", "Upload storage is temporarily unavailable", 503);
  }
}
