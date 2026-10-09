import { apiError, privateApiData } from "@/lib/api-response";
import { apiViewer, databaseErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { postUpdateSchema, zodFields } from "@/lib/hub/schemas";
import { readJsonBody } from "@/lib/security";

type Context = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f-]{36}$/i;

export async function PATCH(request: Request, { params }: Context) {
  const gate = await apiViewer(request);
  if (gate.response) return gate.response;
  const { id } = await params;
  if (!UUID.test(id)) return apiError("NOT_FOUND", "Post not found", 404);
  const parsed = postUpdateSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Check the post details", 422, zodFields(parsed.error));
  const { url, title, kind, publishedOn } = parsed.data;
  try {
    await db()`select public.update_my_post(${gate.viewer.user.id}::uuid, ${id}::uuid, ${url}, ${title ?? null}, ${kind}, ${publishedOn}::date)`;
    return privateApiData({ saved: true });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/me/posts/[id]");
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const gate = await apiViewer(request);
  if (gate.response) return gate.response;
  const { id } = await params;
  if (!UUID.test(id)) return apiError("NOT_FOUND", "Post not found", 404);
  try {
    await db()`select public.delete_my_post(${gate.viewer.user.id}::uuid, ${id}::uuid)`;
    return privateApiData({ deleted: true });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/me/posts/[id]:delete");
  }
}
