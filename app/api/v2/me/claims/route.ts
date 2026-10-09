import { apiError, privateApiData } from "@/lib/api-response";
import { apiViewer, databaseErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { claimSchema, zodFields } from "@/lib/hub/schemas";
import { readJsonBody } from "@/lib/security";

export async function POST(request: Request) {
  const gate = await apiViewer(request);
  if (gate.response) return gate.response;
  const parsed = claimSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Check your claim", 422, zodFields(parsed.error));
  const { personId, note, evidenceUrls } = parsed.data;
  try {
    const rows = await db()`select public.claim_slot(${gate.viewer.user.id}::uuid, ${personId}::uuid, ${note ?? null}, ${evidenceUrls}::text[]) as id`;
    return privateApiData({ id: rows[0].id as string }, undefined, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/me/claims");
  }
}
