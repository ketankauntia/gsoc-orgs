import { apiError, privateApiData } from "@/lib/api-response";
import { apiAdmin, databaseErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { adminProfileStatusSchema, zodFields } from "@/lib/hub/schemas";
import { readJsonBody } from "@/lib/security";

/** Suspend or reinstate an account. Suspended accounts' content leaves public view. */
export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const gate = await apiAdmin(request);
  if (gate.response) return gate.response;
  const { userId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return apiError("NOT_FOUND", "Account not found", 404);
  if (userId === gate.viewer.user.id) return apiError("VALIDATION_ERROR", "You cannot change your own account status", 422);
  const parsed = adminProfileStatusSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Check the details", 422, zodFields(parsed.error));
  try {
    await db()`select public.admin_set_profile_status(${gate.viewer.user.id}::uuid, ${userId}::uuid, ${parsed.data.status}, ${parsed.data.reason ?? null})`;
    return privateApiData({ done: true });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/admin/profiles/[userId]");
  }
}
