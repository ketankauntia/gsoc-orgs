import { apiError, privateApiData } from "@/lib/api-response";
import { apiAdmin, databaseErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { adminHideSchema, zodFields } from "@/lib/hub/schemas";
import { readJsonBody } from "@/lib/security";

/** Hide or show a post. Hidden posts stay stored so the same link cannot be added again. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await apiAdmin(request);
  if (gate.response) return gate.response;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return apiError("NOT_FOUND", "Post not found", 404);
  const parsed = adminHideSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Check the details", 422, zodFields(parsed.error));
  try {
    await db()`select public.admin_set_post_hidden(${gate.viewer.user.id}::uuid, ${id}::uuid, ${parsed.data.hidden}, ${parsed.data.reason ?? null})`;
    return privateApiData({ done: true });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/admin/posts/[id]");
  }
}
