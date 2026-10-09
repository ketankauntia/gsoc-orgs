import { apiError, privateApiData } from "@/lib/api-response";
import { apiAdmin, databaseErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { revalidateContributorWork } from "@/lib/hub/revalidate";
import { findUserIdByEmail } from "@/lib/hub/admin";
import { adminOverrideSchema, zodFields } from "@/lib/hub/schemas";
import { readJsonBody } from "@/lib/security";

/** Records a verified claim the normal rules refuse, for archive exceptions. The account must have signed in once. */
export async function POST(request: Request) {
  const gate = await apiAdmin(request);
  if (gate.response) return gate.response;
  const parsed = adminOverrideSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Check the details", 422, zodFields(parsed.error));
  try {
    const userId = await findUserIdByEmail(parsed.data.email);
    if (!userId) return apiError("NOT_FOUND", "No account with that email has signed in yet", 404, { email: "No account with that email" });
    const rows = await db()`select public.admin_override_claim(${gate.viewer.user.id}::uuid, ${userId}::uuid, ${parsed.data.personId}::uuid, ${parsed.data.reason}) as id`;
    await revalidateContributorWork({ personId: parsed.data.personId });
    return privateApiData({ id: rows[0].id as string }, undefined, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/admin/claims");
  }
}
