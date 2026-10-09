import { apiError, privateApiData } from "@/lib/api-response";
import { apiViewer, databaseErrorResponse } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { postSchema, zodFields } from "@/lib/hub/schemas";
import { readJsonBody } from "@/lib/security";

/** Adds a progress post to a contributor claim. It is public at once with the claim's badge. */
export async function POST(request: Request) {
  const gate = await apiViewer(request);
  if (gate.response) return gate.response;
  const parsed = postSchema.safeParse(await readJsonBody(request).catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Check the post details", 422, zodFields(parsed.error));
  const { personId, url, title, kind, publishedOn } = parsed.data;
  try {
    const rows = await db()`select public.add_my_post(${gate.viewer.user.id}::uuid, ${personId}::uuid, ${url}, ${title ?? null}, ${kind}, ${publishedOn}::date) as id`;
    return privateApiData({ id: rows[0].id as string }, undefined, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error, "api/v2/me/posts");
  }
}
