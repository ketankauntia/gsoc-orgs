import { apiError, privateApiData } from "@/lib/api-response";
import { apiViewer, databaseErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { revalidateContributorWork } from "@/lib/hub/revalidate";
import { participationSchema, zodFields } from "@/lib/hub/schemas";
import { readJsonBody } from "@/lib/security";

type Context = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f-]{36}$/i;

/** Note, evidence (while unverified) and the contributor's story answers. */
export async function PATCH(request: Request, { params }: Context) {
  const gate = await apiViewer(request);
  if (gate.response) return gate.response;
  const { id } = await params;
  if (!UUID.test(id)) return apiError("NOT_FOUND", "Claim not found", 404);
  const parsed = participationSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Check your answers", 422, zodFields(parsed.error));
  const { note, evidenceUrls, story, storyPublic } = parsed.data;
  try {
    await db()`select public.save_my_participation(
      ${gate.viewer.user.id}::uuid, ${id}::uuid, ${note ?? null}, ${evidenceUrls}::text[],
      ${story ? JSON.stringify(story) : null}::jsonb, ${storyPublic}
    )`;
    return privateApiData({ saved: true });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/me/claims/[id]");
  }
}

/** Cancels an unverified claim. */
export async function DELETE(request: Request, { params }: Context) {
  const gate = await apiViewer(request);
  if (gate.response) return gate.response;
  const { id } = await params;
  if (!UUID.test(id)) return apiError("NOT_FOUND", "Claim not found", 404);
  try {
    await revalidateContributorWork({ participationId: id });
    await db()`select public.cancel_my_claim(${gate.viewer.user.id}::uuid, ${id}::uuid)`;
    return privateApiData({ cancelled: true });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/me/claims/[id]:delete");
  }
}
