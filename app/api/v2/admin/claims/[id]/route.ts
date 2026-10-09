import { apiError, privateApiData } from "@/lib/api-response";
import { apiAdmin, databaseErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { adminClaimDecisionSchema, zodFields } from "@/lib/hub/schemas";
import { readJsonBody } from "@/lib/security";

/** Verify or reject a claim. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await apiAdmin(request);
  if (gate.response) return gate.response;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError("NOT_FOUND", "Claim not found", 404);
  const parsed = adminClaimDecisionSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Choose an action", 422, zodFields(parsed.error));
  const adminId = gate.viewer.user.id;
  try {
    if (parsed.data.action === "verify") await db()`select public.admin_verify_participation(${adminId}::uuid, ${id}::uuid)`;
    else await db()`select public.admin_reject_participation(${adminId}::uuid, ${id}::uuid, ${parsed.data.reason})`;
    return privateApiData({ done: true });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/admin/claims/[id]");
  }
}
