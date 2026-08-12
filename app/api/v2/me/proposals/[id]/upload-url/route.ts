import { apiError, privateApiData } from "@/lib/api-response";
import { consumeRateLimit, getUser } from "@/lib/auth";
import { uploadRequestSchema, zodFields } from "@/lib/proposals/schemas";
import { createPdfUploadUrl, newQuarantineKey, PROPOSAL_PDF_MIME } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTrustedMutationRequest, readJsonBody } from "@/lib/security";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutationRequest(request)) return apiError("CROSS_SITE_REQUEST", "Cross-site requests are not allowed", 403);
  const user = await getUser();
  if (!user) return apiError("UNAUTHENTICATED", "Sign in is required", 401);
  const parsed = uploadRequestSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Only PDF files up to 10 MiB are accepted", 422, zodFields(parsed.error));
  const { id } = await params;
  const { data, error } = await createAdminClient().from("proposals").select("id,status").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error) return apiError("UPLOAD_UNAVAILABLE", "Upload could not be started", 500);
  if (!data) return apiError("NOT_FOUND", "Proposal not found", 404);
  if (!["draft", "changes_requested"].includes(data.status)) return apiError("PROPOSAL_LOCKED", "This proposal is locked", 409);
  try {
    if (!(await consumeRateLimit("upload_url"))) return apiError("RATE_LIMITED", "Too many upload attempts; try again later", 429);
    const key = newQuarantineKey(user.id);
    const uploadUrl = await createPdfUploadUrl(key);
    return privateApiData({ key, uploadUrl, expiresIn: 600, headers: { "Content-Type": PROPOSAL_PDF_MIME } });
  } catch (uploadError) {
    console.error("[proposal upload-url]", uploadError);
    return apiError("UPLOAD_UNAVAILABLE", "Upload storage is temporarily unavailable", 503);
  }
}
